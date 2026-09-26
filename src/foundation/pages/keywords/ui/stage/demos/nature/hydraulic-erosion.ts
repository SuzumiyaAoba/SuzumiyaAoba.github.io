import { Vector3 } from "three";
import { palette, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";
import { erosionTerrain, initialHeights } from "../../erosion";

const N = 128;
const WIDTH = 12;
const HEIGHT_SCALE = 3.5;
const LIFETIME = 40;
const RADIUS = 3;
const TRACE_COUNT = 24;
const MAX_DROPLETS = 25_000;

export const demo: DemoModule = {
  alt: "雨粒が山肌を流れ下りながら土を削り、運び、たまった所に落とす水食侵食のデモ。1 粒ずつ、斜面の下り方向へ転がし、速く流れるほど多くの土を運べるとして、運べる量に余裕があれば地面を削り、余れば落とす。何千粒も流すと、山肌に枝分かれした谷筋ができ、ふもとに土がたまって扇状地のような平地が生まれる。",
  camera: { position: [9, 9, 11], target: [0, 1, 0] },
  controls: [
    { type: "toggle", key: "run", label: "雨を降らせる", value: true },
    { type: "button", key: "reset", label: "元の地形に戻す" },
    {
      type: "range",
      key: "rate",
      label: "1 フレームの雨粒",
      min: 10,
      max: 200,
      step: 10,
      value: 40,
    },
    {
      type: "range",
      key: "erode",
      label: "削る強さ",
      min: 0.05,
      max: 0.8,
      step: 0.01,
      value: 0.3,
    },
    {
      type: "range",
      key: "inertia",
      label: "慣性",
      min: 0,
      max: 0.5,
      step: 0.01,
      value: 0.05,
      hint: "大きいほど雨粒がまっすぐ進み、谷が太く滑らかになります。",
    },
    {
      type: "select",
      key: "view",
      label: "色",
      value: "terrain",
      options: [
        { value: "terrain", label: "地形" },
        { value: "change", label: "削れた所 / たまった所" },
      ],
    },
    { type: "toggle", key: "paths", label: "雨粒の通り道", value: true },
  ],
  legend: [
    { color: palette.coral, label: "削れた所" },
    { color: palette.sky, label: "たまった所・雨粒の道" },
  ],
  setup(context) {
    const { scene, params } = context;
    const random = rng(3);
    const initial = initialHeights(N, "hills", 1.7);
    const heights = new Float32Array(initial);
    const terrain = erosionTerrain(N, WIDTH, HEIGHT_SCALE);
    terrain.position.y = -0.4;
    scene.add(terrain);
    const traces = segments([], palette.sky, { width: 1.5, opacity: 0.9 });
    scene.add(traces);
    let total = 0;

    // 半径 RADIUS の円に重みを分けて削る（1 点だけ削ると針のような穴になる）
    const brush: { dx: number; dz: number; weight: number }[] = [];
    let weightSum = 0;
    for (let dz = -RADIUS; dz <= RADIUS; dz++) {
      for (let dx = -RADIUS; dx <= RADIUS; dx++) {
        const weight = Math.max(0, 1 - Math.hypot(dx, dz) / RADIUS);
        if (weight > 0) {
          brush.push({ dx, dz, weight });
          weightSum += weight;
        }
      }
    }

    /** 位置 (x, z) の高さと勾配（周りの 4 点から双線形補間）。 */
    const sample = (x: number, z: number) => {
      const i = Math.floor(x);
      const j = Math.floor(z);
      const u = x - i;
      const v = z - j;
      const index = j * N + i;
      const h00 = heights[index] ?? 0;
      const h10 = heights[index + 1] ?? 0;
      const h01 = heights[index + N] ?? 0;
      const h11 = heights[index + N + 1] ?? 0;
      return {
        height:
          h00 * (1 - u) * (1 - v) +
          h10 * u * (1 - v) +
          h01 * (1 - u) * v +
          h11 * u * v,
        gx: (h10 - h00) * (1 - v) + (h11 - h01) * v,
        gz: (h01 - h00) * (1 - u) + (h11 - h10) * u,
      };
    };

    const toWorld = (x: number, z: number, h: number) =>
      new Vector3(
        (x / (N - 1) - 0.5) * WIDTH,
        h * HEIGHT_SCALE - 0.4 + 0.03,
        (z / (N - 1) - 0.5) * WIDTH
      );

    const droplet = (
      erode: number,
      inertia: number,
      trace: Vector3[] | null
    ) => {
      let x = 1 + random() * (N - 3);
      let z = 1 + random() * (N - 3);
      let dx = 0;
      let dz = 0;
      let speed = 1;
      let water = 1;
      let sediment = 0;
      for (let step = 0; step < LIFETIME; step++) {
        const i = Math.floor(x);
        const j = Math.floor(z);
        const u = x - i;
        const v = z - j;
        const here = sample(x, z);
        // 1. 慣性を残しつつ、下り坂の方向へ向きを変える
        dx = dx * inertia - here.gx * (1 - inertia);
        dz = dz * inertia - here.gz * (1 - inertia);
        const length = Math.hypot(dx, dz);
        if (length < 1e-6) {
          break;
        }
        dx /= length;
        dz /= length;
        x += dx;
        z += dz;
        if (x < 1 || x >= N - 2 || z < 1 || z >= N - 2) {
          break;
        }
        const next = sample(x, z);
        const deltaHeight = next.height - here.height;
        if (trace) {
          trace.push(
            toWorld(x - dx, z - dz, here.height),
            toWorld(x, z, next.height)
          );
        }
        // 2. 運べる土の量：速くて水が多く、急に下るほど多い
        const capacity = Math.max(-deltaHeight * speed * water * 4, 0.01);
        if (sediment > capacity || deltaHeight > 0) {
          // 3a. 運びきれない分（上り坂ならくぼみを埋める分）を元の位置に落とす
          const amount =
            deltaHeight > 0
              ? Math.min(deltaHeight, sediment)
              : (sediment - capacity) * 0.3;
          sediment -= amount;
          const index = j * N + i;
          heights[index] = (heights[index] ?? 0) + amount * (1 - u) * (1 - v);
          heights[index + 1] = (heights[index + 1] ?? 0) + amount * u * (1 - v);
          heights[index + N] = (heights[index + N] ?? 0) + amount * (1 - u) * v;
          heights[index + N + 1] =
            (heights[index + N + 1] ?? 0) + amount * u * v;
        } else {
          // 3b. 余裕がある分だけ周りを削って運ぶ（下った高さより深くは削らない）
          const amount = Math.min((capacity - sediment) * erode, -deltaHeight);
          for (const { dx: bx, dz: bz, weight } of brush) {
            const ci = i + bx;
            const cj = j + bz;
            if (ci < 0 || ci >= N || cj < 0 || cj >= N) {
              continue;
            }
            const index = cj * N + ci;
            const removed = Math.min(
              heights[index] ?? 0,
              (amount * weight) / weightSum
            );
            heights[index] = (heights[index] ?? 0) - removed;
            sediment += removed;
          }
        }
        // 4. 下れば速くなり、水は少しずつ蒸発する
        speed = Math.sqrt(Math.max(0, speed * speed - deltaHeight * 4));
        water *= 0.99;
      }
    };

    const tracePoints: Vector3[] = [];
    const reset = () => {
      heights.set(initial);
      total = 0;
    };

    return {
      action(key) {
        if (key === "reset") {
          reset();
        }
      },
      update({ dt }) {
        const running =
          params["run"] === true && dt > 0 && total < MAX_DROPLETS;
        const showPaths = params["paths"] === true;
        if (running) {
          const count = Number(params["rate"]);
          const erode = Number(params["erode"]);
          const inertia = Number(params["inertia"]);
          tracePoints.length = 0;
          for (let n = 0; n < count; n++) {
            droplet(
              erode,
              inertia,
              showPaths && n < TRACE_COUNT ? tracePoints : null
            );
          }
          total += count;
          traces.setPoints(tracePoints);
        }
        traces.visible =
          showPaths && params["run"] === true && total < MAX_DROPLETS;
        terrain.update(heights, initial, String(params["view"]));
        context.readout("流した雨粒", total.toLocaleString("ja-JP"));
        context.caption(
          total >= MAX_DROPLETS
            ? "2 万 5000 粒を流し終えた。谷筋とふもとの堆積地を「削れた所 / たまった所」の色で確かめてみよう。「元の地形に戻す」でやり直せる。"
            : total < 8000
              ? "雨粒は斜面の下り方向へ進み、速く流れるほど多くの土を運べる。運べる量に余裕があれば地面を削り、坂が緩んで運びきれなくなると土を落とす。"
              : "何千粒も流すと、雨粒が同じ道を通るほど深く削れるので、枝分かれした谷筋が育つ。削った土はふもとの緩やかな所に落ち、平らな堆積地ができる。"
        );
      },
    };
  },
};
