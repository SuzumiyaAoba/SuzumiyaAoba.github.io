import { palette } from "../../kit";
import type { DemoModule } from "../../types";
import { erosionTerrain, initialHeights } from "../../erosion";

const N = 128;
const WIDTH = 12;
const HEIGHT_SCALE = 3.5;
const CELL = WIDTH / (N - 1);
const NEIGHBORS = [
  [-1, 0, 1],
  [1, 0, 1],
  [0, -1, 1],
  [0, 1, 1],
  [-1, -1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [1, 1, Math.SQRT2],
] as const;

export const demo: DemoModule = {
  alt: "急すぎる斜面の土が崩れて崖下にたまる熱・崩落侵食のデモ。各マスを周りの 8 マスと比べ、高さの差が「崩れずにいられる角度（安息角）」を超えていれば、超えた分の土を低い方へ少しずつ移す。段々の崖は角が崩れて、ふもとに一定の傾きの土砂の斜面（崖錐）ができる。地形をクリックすると土を盛れるので、円錐状に崩れていく様子が見られる。",
  camera: { position: [9, 8.5, 11], target: [0, 1, 0] },
  controls: [
    { type: "toggle", key: "run", label: "崩落を進める", value: true },
    { type: "button", key: "reset", label: "元の地形に戻す" },
    {
      type: "range",
      key: "angle",
      label: "安息角",
      min: 15,
      max: 60,
      step: 1,
      value: 34,
      format: (value) => `${value}°`,
      hint: "これより急な斜面は崩れます。乾いた砂はおよそ 30〜35°。",
    },
    {
      type: "range",
      key: "rate",
      label: "1 回に動かす割合",
      min: 0.02,
      max: 0.5,
      step: 0.01,
      value: 0.06,
      hint: "小さいほどゆっくり崩れます。",
    },
    {
      type: "select",
      key: "view",
      label: "色",
      value: "steep",
      options: [
        { value: "steep", label: "崩れる斜面を赤く" },
        { value: "terrain", label: "地形" },
        { value: "change", label: "削れた所 / たまった所" },
      ],
    },
  ],
  legend: [
    { color: palette.coral, label: "安息角より急な斜面" },
    { color: palette.sky, label: "たまった所（色の切り替え時）" },
  ],
  hint: "地形をクリックすると、その場所に土を盛ります。",
  setup(context) {
    const { scene, params } = context;
    const initial = initialHeights(N, "cliffs", 0.6);
    const heights = new Float32Array(initial);
    const delta = new Float32Array(N * N);
    const steep = new Uint8Array(N * N);
    const terrain = erosionTerrain(N, WIDTH, HEIGHT_SCALE);
    terrain.position.y = -0.4;
    scene.add(terrain);
    let iterations = 0;

    context.onPick(
      (point) => {
        const ci = Math.round((point.x / WIDTH + 0.5) * (N - 1));
        const cj = Math.round((point.z / WIDTH + 0.5) * (N - 1));
        for (let dj = -3; dj <= 3; dj++) {
          for (let di = -3; di <= 3; di++) {
            const i = ci + di;
            const j = cj + dj;
            if (i >= 0 && i < N && j >= 0 && j < N && di * di + dj * dj <= 9) {
              heights[j * N + i] = (heights[j * N + i] ?? 0) + 0.35;
            }
          }
        }
      },
      { origin: [0, 1, 0] }
    );

    /** 1 回分：急すぎる所から低い隣へ土を移す。 */
    const relax = (talus: number, rate: number) => {
      delta.fill(0);
      steep.fill(0);
      let moved = 0;
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const index = j * N + i;
          const h = heights[index] ?? 0;
          let totalExcess = 0;
          let maxExcess = 0;
          // 安息角を超えた高さの差（超過分）を、低い隣ごとに合計する
          for (const [di, dj, distance] of NEIGHBORS) {
            const ni = i + di;
            const nj = j + dj;
            if (ni < 0 || ni >= N || nj < 0 || nj >= N) {
              continue;
            }
            const excess = h - (heights[nj * N + ni] ?? 0) - talus * distance;
            if (excess > 0) {
              totalExcess += excess;
              maxExcess = Math.max(maxExcess, excess);
            }
          }
          if (totalExcess <= 0) {
            continue;
          }
          // ほぼ安息角ちょうどの斜面は崩れ終わったものとして色を付けない
          if (maxExcess > talus * 0.08) {
            steep[index] = 1;
          }
          // 一度に全部動かすと行ったり来たりするので、一番大きな超過の一部だけ動かす
          const amount = maxExcess * rate * 0.5;
          moved += amount;
          delta[index] = (delta[index] ?? 0) - amount;
          for (const [di, dj, distance] of NEIGHBORS) {
            const ni = i + di;
            const nj = j + dj;
            if (ni < 0 || ni >= N || nj < 0 || nj >= N) {
              continue;
            }
            const excess = h - (heights[nj * N + ni] ?? 0) - talus * distance;
            if (excess > 0) {
              delta[nj * N + ni] =
                (delta[nj * N + ni] ?? 0) + (amount * excess) / totalExcess;
            }
          }
        }
      }
      for (let index = 0; index < N * N; index++) {
        heights[index] = (heights[index] ?? 0) + (delta[index] ?? 0);
      }
      return moved;
    };

    return {
      action(key) {
        if (key === "reset") {
          heights.set(initial);
          iterations = 0;
        }
      },
      update({ dt }) {
        // 高さマップの 1 マスあたりの高さの差に直した安息角
        const talus =
          (Math.tan((Number(params["angle"]) * Math.PI) / 180) * CELL) /
          HEIGHT_SCALE;
        const rate = Number(params["rate"]);
        let moved = 0;
        if (params["run"] === true && dt > 0) {
          moved = relax(talus, rate);
          iterations += 1;
        } else {
          // 止めている間も、どこが急すぎるかは表示する
          relax(talus, 0);
        }
        const view = String(params["view"]);
        terrain.update(
          heights,
          initial,
          view === "steep" ? "terrain" : view,
          view === "steep" ? steep : undefined
        );
        let steepCount = 0;
        for (const value of steep) {
          steepCount += value;
        }
        context.readout("反復", iterations.toLocaleString("ja-JP"));
        context.readout(
          "崩れる斜面",
          `${((steepCount / (N * N)) * 100).toFixed(1)}%`
        );
        context.caption(
          moved > 0.05 || iterations < 30
            ? "隣との高さの差が安息角を超えたマス（赤）から、超えた分の一部を低い隣へ移す。崖の角が崩れ、落ちた土はふもとに一定の傾きの斜面を作っていく。"
            : "どの斜面も安息角以下になり、崩れが止まった。崖下には同じ傾きの土砂の斜面が並ぶ。安息角を小さくすると、さらに崩れて平らになっていく。"
        );
      },
    };
  },
};
