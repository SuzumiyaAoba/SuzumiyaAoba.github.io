import { Vector3 } from "three";
import { palette, pointCloud, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

const SIZE = 2.9;
const MAX = 2048;
const SEQUENCE_SUFFIX = /（.*）/u;

/** 基数 base の根基逆関数（ファン・デル・コルプト列）。整数の桁を小数点の反対側へ裏返す。 */
function radicalInverse(index: number, base: number) {
  let result = 0;
  let fraction = 1 / base;
  let n = index;
  while (n > 0) {
    result += (n % base) * fraction;
    n = Math.floor(n / base);
    fraction /= base;
  }
  return result;
}

/** ソボル列の 2 次元目（方向数 v_k = v_{k-1} ^ (v_{k-1} >> 1)）。1 次元目は基数 2 の根基逆関数と同じ。 */
const SOBOL_2 = (() => {
  const v = new Uint32Array(32);
  v[0] = 1 << 31;
  for (let k = 1; k < 32; k++) {
    const previous = v[k - 1] ?? 0;
    v[k] = (previous ^ (previous >>> 1)) >>> 0;
  }
  return v;
})();
function sobol2(index: number) {
  let result = 0;
  let n = index;
  let k = 0;
  while (n > 0) {
    if (n & 1) {
      result = (result ^ (SOBOL_2[k] ?? 0)) >>> 0;
    }
    n >>>= 1;
    k++;
  }
  return result / 4_294_967_296;
}

const R2_A = 1 / 1.324717957244746; // 2 次元の黄金比（プラスチック数）の逆数
const SEQUENCES = [
  {
    key: "random",
    name: "でたらめ",
    color: palette.coral,
    point: (_index: number, random: () => number) =>
      [random(), random()] as const,
  },
  {
    key: "halton",
    name: "ハルトン列（2, 3）",
    color: palette.amber,
    point: (i: number) =>
      [radicalInverse(i + 1, 2), radicalInverse(i + 1, 3)] as const,
  },
  {
    key: "sobol",
    name: "ソボル列",
    color: palette.lime,
    point: (i: number) => [radicalInverse(i, 2), sobol2(i)] as const,
  },
  {
    key: "r2",
    name: "R2 列（黄金比）",
    color: palette.sky,
    point: (i: number) =>
      [(0.5 + R2_A * (i + 1)) % 1, (0.5 + R2_A * R2_A * (i + 1)) % 1] as const,
  },
] as const;

export const demo: DemoModule = {
  alt: "正方形の中に点を 1 つずつ増やしていくとき、でたらめな乱数と、低食い違い列（ハルトン列、ソボル列、R2 列）とで、埋まり方を比べるデモ。でたらめだと、点が固まった所と大きなすき間ができる。低食い違い列は、次の点を「まだすいている所」に置くように作られた数列なので、点の数がいくつの時点でも正方形がまんべんなく埋まる。右下のグラフは、点の数を増やしたときの、4 分の 1 円の面積の見積もりの誤差で、低食い違い列の方が速く小さくなる。",
  camera: { position: [0, 0, 11.5], target: [0, 0, 0], orbit: false, fov: 40 },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "range",
      key: "speed",
      label: "1 秒に増やす点の数",
      min: 5,
      max: 300,
      step: 5,
      value: 40,
    },
    {
      type: "range",
      key: "limit",
      label: "最大の点の数",
      min: 16,
      max: MAX,
      step: 16,
      value: 512,
    },
    { type: "toggle", key: "grid", label: "8 × 8 の区画を表示", value: true },
    {
      type: "toggle",
      key: "circle",
      label: "4 分の 1 円（面積の見積もり）を表示",
      value: true,
    },
  ],
  legend: SEQUENCES.map(({ color, name }) => ({ color, label: name })),
  setup(context) {
    const { scene, params } = context;
    const random = rng(9);
    const panels = SEQUENCES.map((sequence, index) => {
      const x = (index - 1.5) * (SIZE + 0.6);
      const y = 0.75;
      const origin = new Vector3(x - SIZE / 2, y - SIZE / 2, 0);
      const frame = segments(
        [
          [0, 0, 1, 0],
          [1, 0, 1, 1],
          [1, 1, 0, 1],
          [0, 1, 0, 0],
        ].flatMap(([ax = 0, ay = 0, bx = 0, by = 0]) => [
          origin.clone().add(new Vector3(ax * SIZE, ay * SIZE, 0)),
          origin.clone().add(new Vector3(bx * SIZE, by * SIZE, 0)),
        ]),
        palette.muted,
        { width: 1.5 }
      );
      scene.add(frame);
      const gridLines: Vector3[] = [];
      for (let k = 1; k < 8; k++) {
        gridLines.push(
          origin.clone().add(new Vector3((k / 8) * SIZE, 0, 0)),
          origin.clone().add(new Vector3((k / 8) * SIZE, SIZE, 0))
        );
        gridLines.push(
          origin.clone().add(new Vector3(0, (k / 8) * SIZE, 0)),
          origin.clone().add(new Vector3(SIZE, (k / 8) * SIZE, 0))
        );
      }
      const grid = segments(gridLines, palette.faint, { width: 1 });
      scene.add(grid);
      const arc: Vector3[] = [];
      for (let k = 0; k < 48; k++) {
        const a0 = (k / 48) * (Math.PI / 2);
        const a1 = ((k + 1) / 48) * (Math.PI / 2);
        arc.push(
          origin
            .clone()
            .add(new Vector3(Math.cos(a0) * SIZE, Math.sin(a0) * SIZE, 0)),
          origin
            .clone()
            .add(new Vector3(Math.cos(a1) * SIZE, Math.sin(a1) * SIZE, 0))
        );
      }
      const circle = segments(arc, palette.ink, { width: 1.5, opacity: 0.6 });
      scene.add(circle);
      const dots = pointCloud(MAX, { size: 9, color: sequence.color });
      dots.position.copy(origin);
      dots.position.z = 0.01;
      scene.add(dots);
      const label = context.label(sequence.name, { tone: "strong" });
      label.position.set(x, y - SIZE / 2 - 0.4, 0);
      scene.add(label);
      return { ...sequence, dots, grid, circle, inside: 0, emptyCells: 0 };
    });
    const graph = historyGraph(context, {
      title: "4 分の 1 円の面積の誤差",
      min: 0,
      max: 0.08,
      length: 160,
      series: SEQUENCES.map(({ color }) => ({ color })),
    });

    let count = 0;
    let budget = 0;
    let hold = 0;
    const cells = SEQUENCES.map(() => new Uint16Array(64));
    return {
      update({ dt }) {
        const limit = Number(params["limit"]);
        budget += dt * Number(params["speed"]);
        while (budget >= 1 && count < limit) {
          budget -= 1;
          for (const [p, panel] of panels.entries()) {
            const [u, v] = panel.point(count, random);
            panel.dots.positions.set([u * SIZE, v * SIZE, 0], count * 3);
            if (u * u + v * v < 1) {
              panel.inside++;
            }
            const cellsOf = cells[p];
            if (cellsOf) {
              const cell =
                Math.min(7, Math.floor(v * 8)) * 8 +
                Math.min(7, Math.floor(u * 8));
              cellsOf[cell] = (cellsOf[cell] ?? 0) + 1;
            }
          }
          count++;
          if (count % 4 === 0) {
            const pointCount = count;
            graph.push(
              panels.map((panel) =>
                Math.abs(panel.inside / pointCount - Math.PI / 4)
              )
            );
          }
        }
        if (count >= limit) {
          hold += dt;
          if (hold > 3) {
            hold = 0;
            count = 0;
            graph.clear();
            for (const panel of panels) {
              panel.inside = 0;
            }
            for (const c of cells) {
              c.fill(0);
            }
          }
        }
        for (const [p, panel] of panels.entries()) {
          panel.dots.geometry.setDrawRange(0, count);
          panel.dots.commit();
          panel.grid.visible = params["grid"] === true;
          panel.circle.visible = params["circle"] === true;
          panel.emptyCells =
            cells[p]?.filter((value) => value === 0).length ?? 0;
        }
        context.readout("点の数", `${count}`);
        context.readout(
          "空の区画（8×8）",
          panels
            .map(
              (panel) =>
                `${panel.name.replace(SEQUENCE_SUFFIX, "")} ${panel.emptyCells}`
            )
            .join("・")
        );
        context.readout(
          "面積の誤差",
          panels
            .map((panel) =>
              count > 0
                ? Math.abs(panel.inside / count - Math.PI / 4).toFixed(3)
                : "—"
            )
            .join(" / ")
        );
        context.caption(
          count < 64
            ? "点が少ないうちから違いが出る。でたらめ（赤）は固まったりすき間が空いたりするが、低食い違い列は、次の点を前の点から離れた所に置くので、いつの時点でも全体がまんべんなく埋まる。"
            : "64 個の区画のうち、点が 1 つもない区画の数を比べてみる。低食い違い列はすぐに全部の区画が埋まる。面積の見積もりの誤差も、でたらめはなかなか小さくならないが、低食い違い列は点を増やすほどすばやく小さくなる。"
        );
      },
    };
  },
};
