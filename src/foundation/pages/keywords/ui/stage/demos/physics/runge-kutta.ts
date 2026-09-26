import { Mesh, SphereGeometry, Vector3 } from "three";
import { arrow, palette, polyline, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";

type Vec2 = { x: number; z: number };
type Method = "euler" | "rk2" | "rk4";

const METHODS: readonly {
  key: Method;
  color: string;
  label: string;
  evaluations: number;
}[] = [
  {
    key: "euler",
    color: palette.coral,
    label: "オイラー法（1 回評価）",
    evaluations: 1,
  },
  {
    key: "rk2",
    color: palette.amber,
    label: "RK2・中点法（2 回評価）",
    evaluations: 2,
  },
  { key: "rk4", color: palette.cyan, label: "RK4（4 回評価）", evaluations: 4 },
];
const START: Vec2 = { x: 0, z: 2.6 };
const HISTORY = 700;

/** 流れの速度：1 つの渦なら円、2 つの渦なら 8 の字のような道筋になる。 */
function velocity(field: string, p: Vec2): Vec2 {
  if (field === "single") {
    return { x: -p.z * 0.9, z: p.x * 0.9 };
  }
  let vx = 0;
  let vz = 0;
  for (const [cx, spin] of [
    [-1.8, 1],
    [1.8, -1],
  ] as const) {
    const dx = p.x - cx;
    const dz = p.z;
    const falloff = 2.4 / (1 + (dx * dx + dz * dz) * 0.35);
    vx += -dz * falloff * spin;
    vz += dx * falloff * spin;
  }
  return { x: vx, z: vz };
}

const add = (p: Vec2, v: Vec2, k: number): Vec2 => ({
  x: p.x + v.x * k,
  z: p.z + v.z * k,
});

/** 1 ステップ進め、途中で傾きを評価した位置と傾きも返す。 */
function advance(field: string, method: Method, p: Vec2, h: number) {
  const samples: { at: Vec2; slope: Vec2 }[] = [];
  const f = (at: Vec2) => {
    const slope = velocity(field, at);
    samples.push({ at, slope });
    return slope;
  };
  if (method === "euler") {
    const k1 = f(p);
    return { next: add(p, k1, h), samples };
  }
  if (method === "rk2") {
    const k1 = f(p);
    const k2 = f(add(p, k1, h / 2)); // 半歩進んだ所（中点）の傾きで 1 歩進む
    return { next: add(p, k2, h), samples };
  }
  const k1 = f(p);
  const k2 = f(add(p, k1, h / 2));
  const k3 = f(add(p, k2, h / 2));
  const k4 = f(add(p, k3, h));
  return {
    next: {
      x: p.x + (h / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
      z: p.z + (h / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
    },
    samples,
  };
}

const toVector = (p: Vec2, y = 0.15) => new Vector3(p.x, y, p.z);

export const demo: DemoModule = {
  alt: "渦を巻く流れに乗せた 3 つの粒を、オイラー法、2 次のルンゲ・クッタ法（中点法）、4 次のルンゲ・クッタ法で動かして比べるデモ。本当の道筋は白い点線の円だが、今いる場所の傾きだけで進むオイラー法は外へ外へとずれていく。途中の何か所かで傾きを調べて平均する RK4 は、大きな時間刻みでもほとんど円からずれない。",
  camera: { position: [0, 10, 6.5], target: [0, 0, 0.3] },
  controls: [
    {
      type: "select",
      key: "field",
      label: "流れ",
      value: "single",
      options: [
        { value: "single", label: "1 つの渦（正解は円）" },
        { value: "double", label: "2 つの渦" },
      ],
    },
    {
      type: "range",
      key: "h",
      label: "時間刻み h",
      min: 0.05,
      max: 0.8,
      step: 0.01,
      value: 0.35,
    },
    {
      type: "toggle",
      key: "samples",
      label: "RK4 が傾きを調べる場所",
      value: true,
    },
    { type: "button", key: "reset", label: "最初から" },
  ],
  legend: [
    ...METHODS.map(({ color, label }) => ({ color, label })),
    { color: palette.ink, label: "本当の道筋" },
  ],
  setup(context) {
    const { scene, params } = context;
    const tracers = METHODS.map((method) => {
      const ball = new Mesh(
        new SphereGeometry(0.13, 24, 16),
        standard(method.color, { emissive: 0.7 })
      );
      ball.castShadow = true;
      const path = polyline([], method.color, { width: 2.5 });
      scene.add(ball, path);
      return {
        ...method,
        ball,
        path,
        position: { ...START },
        history: [] as Vector3[],
      };
    });
    const reference = polyline([], palette.ink, {
      width: 1.5,
      dashed: true,
      opacity: 0.8,
    });
    scene.add(reference);
    const field = segments([], "#51607a", { width: 1.5 });
    scene.add(field);
    const probes = Array.from({ length: 4 }, () => {
      const probe = arrow(palette.cyan, {
        radius: 0.02,
        headLength: 0.14,
        emissive: 0.8,
      });
      scene.add(probe);
      return probe;
    });

    let currentField = "";
    let lastSamples: { at: Vec2; slope: Vec2 }[] = [];
    let accumulator = 0;
    const reset = (kind: string) => {
      currentField = kind;
      accumulator = 0;
      for (const tracer of tracers) {
        tracer.position = { ...START };
        tracer.history = [toVector(START)];
      }
      // 正解の道筋：ごく小さな刻みの RK4
      const points: Vector3[] = [];
      let p = { ...START };
      for (let index = 0; index < 1600; index++) {
        if (index % 4 === 0) {
          points.push(toVector(p, 0.05));
        }
        p = advance(kind, "rk4", p, 0.01).next;
      }
      reference.setPoints(points);
      // 流れの向きを示す短い線
      const arrows: Vector3[] = [];
      for (let x = -5; x <= 5; x += 0.8) {
        for (let z = -3.6; z <= 3.6; z += 0.8) {
          const v = velocity(kind, { x, z });
          const length = Math.hypot(v.x, v.z);
          const scale = Math.min(0.32, length * 0.2) / Math.max(length, 1e-4);
          arrows.push(
            new Vector3(x, 0.02, z),
            new Vector3(x + v.x * scale, 0.02, z + v.z * scale)
          );
        }
      }
      field.setPoints(arrows);
    };

    return {
      action(key) {
        if (key === "reset") {
          reset(String(params["field"]));
        }
      },
      update({ dt }) {
        const kind = String(params["field"]);
        if (kind !== currentField) {
          reset(kind);
        }
        const h = Number(params["h"]);
        // どの刻みでも同じ速さで進んで見えるよう、1 秒あたり 1.2 単位時間ずつ進める
        accumulator += dt * 1.2;
        while (accumulator >= h) {
          accumulator -= h;
          for (const tracer of tracers) {
            if (Math.hypot(tracer.position.x, tracer.position.z) > 12) {
              continue;
            }
            const result = advance(kind, tracer.key, tracer.position, h);
            tracer.position = result.next;
            tracer.history.push(toVector(result.next));
            if (tracer.history.length > HISTORY) {
              tracer.history.shift();
            }
            if (tracer.key === "rk4") {
              lastSamples = result.samples;
            }
          }
        }
        for (const tracer of tracers) {
          tracer.ball.position.copy(toVector(tracer.position));
          tracer.path.setPoints(tracer.history);
        }
        const showSamples = params["samples"] === true;
        for (const [index, probe] of probes.entries()) {
          const sample = lastSamples[index];
          probe.visible = showSamples && sample !== undefined;
          if (showSamples && sample) {
            probe.set(
              toVector(sample.at, 0.3),
              new Vector3(sample.slope.x, 0, sample.slope.z).multiplyScalar(h)
            );
          }
        }
        if (kind === "single") {
          for (const tracer of tracers) {
            const error =
              Math.hypot(tracer.position.x, tracer.position.z) /
                Math.hypot(START.x, START.z) -
              1;
            context.readout(
              tracer.label.split("（")[0] ?? tracer.label,
              `半径のずれ ${(error * 100).toFixed(1)}%`
            );
          }
        }
        context.caption(
          "オイラー法は今いる場所の向きにまっすぐ進むので、曲がった道では必ず外へはみ出す。RK4 は 1 歩の間に 4 か所（青緑の矢印）で向きを調べ、重み付きで平均して進むので、同じ刻みでもずっと正確。計算は 4 倍だが、刻みを何倍にも大きくできる。"
        );
      },
    };
  },
};
