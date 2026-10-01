import { Color, Vector3 } from "three";
import { TAU, palette, pointCloud, polyline, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";

const COUNT = 1200;
const WIDTH = 12;
const DEPTH = 7;
const RADIUS = 0.6;

/** セルの座標（整数）を表の番号へ写すハッシュ関数（大きな素数を掛けて混ぜる）。 */
const hashCell = (cx: number, cy: number, size: number) => {
  const h = Math.imul(cx, 73_856_093) ^ Math.imul(cy, 19_349_663);
  return ((h % size) + size) % size;
};

export const demo: DemoModule = {
  alt: "大量の粒子の近くにいる粒子を、空間ハッシュで素早く探すデモ。平面を、探す半径と同じ大きさのセルに分け、各粒子を、いるセルの座標から計算したハッシュ値の番号の入れ物に入れておく。ある点の周りを探すときは、その点のセルと周りの 8 つのセルの入れ物だけを見ればよいので、1200 個全部と距離を比べずに済む。表を小さくすると、離れたセルが同じ入れ物に入る「衝突」が起き、余計な候補が混ざる。",
  camera: {
    position: [0, 10, 5.5],
    target: [0, 0, 0.3],
    fov: 42,
    orbit: false,
  },
  controls: [
    {
      type: "range",
      key: "table",
      label: "ハッシュ表の大きさ",
      min: 4,
      max: 12,
      step: 1,
      value: 11,
      format: (value) => `${2 ** value}`,
    },
    {
      type: "range",
      key: "speed",
      label: "粒子の速さ",
      min: 0,
      max: 2,
      step: 0.1,
      value: 0.6,
    },
    { type: "toggle", key: "grid", label: "セルの線を表示", value: true },
  ],
  legend: [
    { color: palette.amber, label: "調べる 9 つのセル" },
    { color: palette.lime, label: "半径の中にいた粒子（答え）" },
    { color: palette.sky, label: "候補として距離を比べた粒子" },
    { color: palette.coral, label: "ハッシュの衝突で混ざった、別のセルの粒子" },
  ],
  hint: "カーソルの周りを探します（カーソルがないときは自動で動きます）",
  setup(context) {
    const { scene, params } = context;
    const random = rng(2);
    const x = new Float32Array(COUNT);
    const y = new Float32Array(COUNT);
    const vx = new Float32Array(COUNT);
    const vy = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      x[i] = (random() - 0.5) * WIDTH;
      y[i] = (random() - 0.5) * DEPTH;
      const angle = random() * TAU;
      vx[i] = Math.cos(angle);
      vy[i] = Math.sin(angle);
    }
    const dots = pointCloud(COUNT, { size: 18 });
    scene.add(dots);
    const gridLines: Vector3[] = [];
    for (
      let gx = -Math.ceil(WIDTH / 2 / RADIUS);
      gx <= Math.ceil(WIDTH / 2 / RADIUS);
      gx++
    ) {
      gridLines.push(
        new Vector3(gx * RADIUS, 0.01, -DEPTH / 2),
        new Vector3(gx * RADIUS, 0.01, DEPTH / 2)
      );
    }
    for (
      let gy = -Math.ceil(DEPTH / 2 / RADIUS);
      gy <= Math.ceil(DEPTH / 2 / RADIUS);
      gy++
    ) {
      gridLines.push(
        new Vector3(-WIDTH / 2, 0.01, gy * RADIUS),
        new Vector3(WIDTH / 2, 0.01, gy * RADIUS)
      );
    }
    const grid = segments(gridLines, palette.faint, { width: 1 });
    scene.add(grid);
    const cellsLine = segments([], palette.amber, { width: 2.5 });
    const circle = polyline([], palette.lime, { width: 2.5 });
    scene.add(cellsLine, circle);

    const base = new Color("#5d6b80");
    const lime = new Color(palette.lime);
    const sky = new Color(palette.sky);
    const coral = new Color(palette.coral);
    let bucketStart = new Int32Array(0);
    let bucketItems = new Int32Array(COUNT);
    const cellX = new Int32Array(COUNT);
    const cellY = new Int32Array(COUNT);

    return {
      update({ dt, time }) {
        const speed = Number(params["speed"]);
        for (let i = 0; i < COUNT; i++) {
          x[i] = (x[i] ?? 0) + (vx[i] ?? 0) * dt * speed;
          y[i] = (y[i] ?? 0) + (vy[i] ?? 0) * dt * speed;
          if (Math.abs(x[i] ?? 0) > WIDTH / 2) {
            vx[i] = -(vx[i] ?? 0);
            x[i] = Math.sign(x[i] ?? 0) * (WIDTH / 2);
          }
          if (Math.abs(y[i] ?? 0) > DEPTH / 2) {
            vy[i] = -(vy[i] ?? 0);
            y[i] = Math.sign(y[i] ?? 0) * (DEPTH / 2);
          }
        }
        // 表を作る：数える → 累積和で置き場所を決める → 入れる（数え上げソート）
        const size = 2 ** Number(params["table"]);
        if (bucketStart.length !== size + 1) {
          bucketStart = new Int32Array(size + 1);
        }
        bucketStart.fill(0);
        const bucketOf = new Int32Array(COUNT);
        for (let i = 0; i < COUNT; i++) {
          cellX[i] = Math.floor((x[i] ?? 0) / RADIUS);
          cellY[i] = Math.floor((y[i] ?? 0) / RADIUS);
          const bucket = hashCell(cellX[i] ?? 0, cellY[i] ?? 0, size);
          bucketOf[i] = bucket;
          bucketStart[bucket + 1] = (bucketStart[bucket + 1] ?? 0) + 1;
        }
        for (let b = 0; b < size; b++) {
          bucketStart[b + 1] =
            (bucketStart[b + 1] ?? 0) + (bucketStart[b] ?? 0);
        }
        const fill = bucketStart.slice(0, size);
        if (bucketItems.length !== COUNT) {
          bucketItems = new Int32Array(COUNT);
        }
        for (let i = 0; i < COUNT; i++) {
          const bucket = bucketOf[i] ?? 0;
          bucketItems[fill[bucket] ?? 0] = i;
          fill[bucket] = (fill[bucket] ?? 0) + 1;
        }

        const pointer = context.pointerOnPlane();
        const query =
          pointer &&
          Math.abs(pointer.x) < WIDTH / 2 &&
          Math.abs(pointer.z) < DEPTH / 2
            ? { x: pointer.x, y: pointer.z }
            : { x: Math.sin(time * 0.3) * 4.5, y: Math.sin(time * 0.47) * 2.4 };
        const qx = Math.floor(query.x / RADIUS);
        const qy = Math.floor(query.y / RADIUS);
        const colors: Color[] = Array.from({ length: COUNT }, () => base);
        let candidates = 0;
        let foreign = 0;
        let found = 0;
        const visited = new Set<number>();
        const cellLines: Vector3[] = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const cx = qx + dx;
            const cy = qy + dy;
            const x0 = cx * RADIUS;
            const y0 = cy * RADIUS;
            cellLines.push(
              new Vector3(x0, 0.02, y0),
              new Vector3(x0 + RADIUS, 0.02, y0),
              new Vector3(x0 + RADIUS, 0.02, y0),
              new Vector3(x0 + RADIUS, 0.02, y0 + RADIUS),
              new Vector3(x0 + RADIUS, 0.02, y0 + RADIUS),
              new Vector3(x0, 0.02, y0 + RADIUS),
              new Vector3(x0, 0.02, y0 + RADIUS),
              new Vector3(x0, 0.02, y0)
            );
            const bucket = hashCell(cx, cy, size);
            // 同じ入れ物を 2 回見ないようにする（衝突したセルどうし）
            if (visited.has(bucket)) {
              continue;
            }
            visited.add(bucket);
            for (
              let k = bucketStart[bucket] ?? 0;
              k < (bucketStart[bucket + 1] ?? 0);
              k++
            ) {
              const i = bucketItems[k] ?? 0;
              candidates++;
              const inNeighborhood =
                Math.abs((cellX[i] ?? 0) - qx) <= 1 &&
                Math.abs((cellY[i] ?? 0) - qy) <= 1;
              if (!inNeighborhood) {
                // 別の場所のセルが、たまたま同じ入れ物に入っていた
                foreign++;
                colors[i] = coral;
                continue;
              }
              const distance = Math.hypot(
                (x[i] ?? 0) - query.x,
                (y[i] ?? 0) - query.y
              );
              if (distance < RADIUS) {
                found++;
                colors[i] = lime;
              } else {
                colors[i] = sky;
              }
            }
          }
        }
        for (let i = 0; i < COUNT; i++) {
          dots.positions.set([x[i] ?? 0, 0.05, y[i] ?? 0], i * 3);
          const color = colors[i] ?? base;
          dots.colors.set([color.r, color.g, color.b], i * 3);
        }
        dots.commit();
        cellsLine.setPoints(cellLines);
        const ring: Vector3[] = [];
        for (let s = 0; s <= 48; s++) {
          const a = (s / 48) * TAU;
          ring.push(
            new Vector3(
              query.x + Math.cos(a) * RADIUS,
              0.03,
              query.y + Math.sin(a) * RADIUS
            )
          );
        }
        circle.setPoints(ring);
        grid.visible = params["grid"] === true;
        context.readout("総当たりなら", `${COUNT} 個と比べる`);
        context.readout(
          "空間ハッシュ",
          `${candidates} 個の候補（うち衝突 ${foreign}）`
        );
        context.readout("半径の中の粒子", `${found}`);
        context.caption(
          foreign > 0
            ? `ハッシュ表が ${size} しかないので、離れたセルの粒子が同じ入れ物に入り（赤）、余計に比べている。表を大きくすると衝突が減る。実際には粒子の数の 2 倍程度の表を使うことが多い。`
            : "探す点のセルと周りの 8 つのセル（黄色の枠）の入れ物だけを見て、中の粒子と距離を比べる。セルの大きさを探す半径と同じにしておけば、半径の中の粒子は必ずこの 9 セルのどれかにいる。"
        );
      },
    };
  },
};
