import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  SphereGeometry,
  Vector3,
} from "three";
import { palette, polyline, standard, trail } from "../../kit";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

const GM = 4;
const START_RADIUS = 3;
const SPRING_K = 3;
const SPRING_AMPLITUDE = 1.6;

type State = { x: number; y: number; vx: number; vy: number };
type Method = "explicit" | "semi" | "reference";

const METHODS: readonly { key: Method; color: string; label: string }[] = [
  { key: "explicit", color: palette.coral, label: "陽的オイラー法" },
  { key: "semi", color: palette.cyan, label: "半陰的オイラー法" },
  {
    key: "reference",
    color: palette.amber,
    label: "正確な解（細かい刻みの RK4）",
  },
];

/** 惑星の軌道なら太陽の引力、ばねならフックの法則。 */
function acceleration(scene: string, x: number, y: number) {
  if (scene === "spring") {
    return { ax: -SPRING_K * x, ay: 0 };
  }
  const r = Math.hypot(x, y);
  const factor = -GM / (r * r * r);
  return { ax: factor * x, ay: factor * y };
}

const add = (s: State, d: State, k: number): State => ({
  x: s.x + d.x * k,
  y: s.y + d.y * k,
  vx: s.vx + d.vx * k,
  vy: s.vy + d.vy * k,
});

function energy(scene: string, state: State) {
  const kinetic = 0.5 * (state.vx * state.vx + state.vy * state.vy);
  if (scene === "spring") {
    return kinetic + 0.5 * SPRING_K * state.x * state.x;
  }
  return kinetic - GM / Math.hypot(state.x, state.y);
}

function step(scene: string, method: Method, state: State, dt: number) {
  if (method === "explicit") {
    // 位置を「古い速度」で進めてから、速度を更新する
    const { ax, ay } = acceleration(scene, state.x, state.y);
    state.x += state.vx * dt;
    state.y += state.vy * dt;
    state.vx += ax * dt;
    state.vy += ay * dt;
  } else if (method === "semi") {
    // 速度を先に更新し、「新しい速度」で位置を進める
    const { ax, ay } = acceleration(scene, state.x, state.y);
    state.vx += ax * dt;
    state.vy += ay * dt;
    state.x += state.vx * dt;
    state.y += state.vy * dt;
  } else {
    // 比較用：刻みを細かくした 4 次のルンゲ・クッタ法
    const h = dt / 8;
    for (let sub = 0; sub < 8; sub++) {
      const derivative = (s: State) => {
        const { ax, ay } = acceleration(scene, s.x, s.y);
        return { x: s.vx, y: s.vy, vx: ax, vy: ay };
      };
      const k1 = derivative(state);
      const k2 = derivative(add(state, k1, h / 2));
      const k3 = derivative(add(state, k2, h / 2));
      const k4 = derivative(add(state, k3, h));
      state.x += (h / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x);
      state.y += (h / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y);
      state.vx += (h / 6) * (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx);
      state.vy += (h / 6) * (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy);
    }
  }
}

/** ばねのコイルの形。 */
const coilPoints = (from: number, to: number, lane: number) => {
  const points: Vector3[] = [];
  const turns = 14;
  for (let index = 0; index <= turns * 8; index++) {
    const t = index / (turns * 8);
    const angle = t * turns * Math.PI * 2;
    points.push(
      new Vector3(
        from + (to - from) * t,
        0.35 + Math.sin(angle) * 0.16,
        lane + Math.cos(angle) * 0.16
      )
    );
  }
  return points;
};

export const demo: DemoModule = {
  alt: "同じ初期状態から、3 つの方法で運動を計算して比べるデモ。太陽の周りを回る衛星では、位置を先に進める陽的オイラー法は 1 周ごとに外へ膨らんで飛び去ってしまうが、速度を先に更新してから位置を進める半陰的オイラー法は、少しゆがみながらも同じ軌道を回り続ける。ばねにつないだ箱でも、陽的オイラー法は揺れがどんどん大きくなる。",
  camera: { position: [0, 12.5, 8.5], target: [-0.6, 0, 0.6] },
  controls: [
    {
      type: "select",
      key: "scene",
      label: "題材",
      value: "orbit",
      options: [
        { value: "orbit", label: "惑星の軌道" },
        { value: "spring", label: "ばねの振動" },
      ],
    },
    {
      type: "range",
      key: "hz",
      label: "物理の更新回数",
      min: 5,
      max: 120,
      step: 1,
      value: 20,
      format: (value) => `${value} 回/秒`,
      hint: "少ないほど 1 回の時間刻みが大きくなり、誤差が目立ちます。",
    },
    {
      type: "range",
      key: "speed",
      label: "再生速度",
      min: 0.25,
      max: 4,
      step: 0.25,
      value: 1.5,
    },
    { type: "button", key: "reset", label: "最初から" },
  ],
  legend: METHODS.map(({ color, label }) => ({ color, label })),
  setup(context) {
    const { scene, params } = context;
    const orbitRoot = new Group();
    const springRoot = new Group();
    scene.add(orbitRoot, springRoot);

    const sun = new Mesh(
      new SphereGeometry(0.45, 40, 24),
      standard("#ffcf6b", { emissive: 1.4 })
    );
    sun.position.y = 0.6;
    orbitRoot.add(sun);

    const bodies = METHODS.map((method, index) => {
      const planet = new Mesh(
        new SphereGeometry(0.16, 24, 16),
        standard(method.color, { emissive: 0.6 })
      );
      planet.castShadow = true;
      const path = trail(600, method.color, { width: 2.2 });
      const trailGroup = new Group();
      trailGroup.add(path);
      orbitRoot.add(planet, trailGroup);
      // ばねの箱（手前から奥へ 3 列）
      const lane = (index - 1) * 1.4;
      const box = new Mesh(
        new BoxGeometry(0.6, 0.6, 0.6),
        standard(method.color, { roughness: 0.5 })
      );
      box.castShadow = true;
      const rail = new Mesh(
        new CylinderGeometry(0.03, 0.03, 8, 8),
        standard("#56627a")
      );
      rail.rotation.z = Math.PI / 2;
      rail.position.set(0.5, 0.05, lane);
      const coil = polyline([], palette.amber, { width: 2 });
      springRoot.add(box, rail, coil);
      return {
        method: method.key,
        planet,
        path,
        box,
        coil,
        lane,
        state: { x: 0, y: 0, vx: 0, vy: 0 },
      };
    });
    const wall = new Mesh(new BoxGeometry(0.3, 1.4, 4.2), standard("#4a5568"));
    wall.position.set(-3.6, 0.7, 0);
    springRoot.add(wall);

    const graph = historyGraph(context, {
      title: "エネルギーのずれ（0 が正しい）",
      min: -0.6,
      max: 0.6,
      series: METHODS.map(({ color }) => ({ color })),
    });

    let currentScene = "";
    let accumulator = 0;
    let startEnergy = 1;
    const reset = (kind: string) => {
      currentScene = kind;
      accumulator = 0;
      graph.clear();
      for (const body of bodies) {
        if (kind === "spring") {
          Object.assign(body.state, {
            x: SPRING_AMPLITUDE,
            y: 0,
            vx: 0,
            vy: 0,
          });
        } else {
          Object.assign(body.state, {
            x: START_RADIUS,
            y: 0,
            vx: 0,
            vy: Math.sqrt(GM / START_RADIUS) * 1.12,
          });
        }
        body.path.reset();
      }
      startEnergy = energy(
        kind,
        bodies[0]?.state ?? { x: 1, y: 0, vx: 0, vy: 0 }
      );
      orbitRoot.visible = kind === "orbit";
      springRoot.visible = kind === "spring";
    };

    return {
      action(key) {
        if (key === "reset") {
          reset(String(params["scene"]));
        }
      },
      update({ dt }) {
        const kind = String(params["scene"]);
        if (kind !== currentScene) {
          reset(kind);
        }
        const stepDt = 1 / Number(params["hz"]);
        accumulator += dt * Number(params["speed"]);
        let steps = 0;
        while (accumulator >= stepDt && steps < 400) {
          accumulator -= stepDt;
          steps++;
          for (const body of bodies) {
            const { state } = body;
            // 遠くへ飛び去ったものは止めておく
            if (Math.hypot(state.x, state.y) < 40) {
              step(kind, body.method, state, stepDt);
            }
          }
        }
        for (const body of bodies) {
          const { state } = body;
          if (kind === "orbit") {
            body.planet.position.set(state.x, 0.6, -state.y);
            if (steps > 0) {
              body.path.push(body.planet.position);
            }
          } else {
            const x = Math.max(-3.1, Math.min(6, state.x));
            body.box.position.set(x, 0.35, body.lane);
            body.coil.setPoints(coilPoints(-3.45, x - 0.3, body.lane));
          }
        }
        if (steps > 0) {
          graph.push(
            bodies.map(
              (body) =>
                (energy(kind, body.state) - startEnergy) / Math.abs(startEnergy)
            )
          );
        }
        const explicit = bodies[0]?.state;
        const semi = bodies[1]?.state;
        if (explicit && semi) {
          context.readout(
            "陽的のずれ",
            `${(((energy(kind, explicit) - startEnergy) / Math.abs(startEnergy)) * 100).toFixed(0)}%`
          );
          context.readout(
            "半陰的のずれ",
            `${(((energy(kind, semi) - startEnergy) / Math.abs(startEnergy)) * 100).toFixed(0)}%`
          );
        }
        context.caption(
          kind === "orbit"
            ? "陽的オイラー法（赤）は位置を古い速度で進めるので、毎回わずかに外へ踏み出し、エネルギーが増え続けて軌道が広がる。半陰的オイラー法（青緑）は新しい速度で進めるので、誤差が行ったり来たりして打ち消し合い、長く回り続ける。"
            : "ばねでも同じ。陽的オイラー法の箱は揺れがどんどん大きくなるが、半陰的オイラー法の箱は同じ幅で揺れ続ける。計算量はどちらも同じで、順番を入れ替えただけの違い。"
        );
      },
    };
  },
};
