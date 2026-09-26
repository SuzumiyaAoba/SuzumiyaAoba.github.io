import {
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from "three";
import { palette, rng } from "../../kit";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

const COLS = 28;
const ROWS = 18;
const CELL = 24;
const ZOOM = 300;

type Method = "random" | "stratified" | "grid";

/** 1 画素の中の標本点（0〜1 の座標）。 */
function samplesFor(method: Method, count: number, random: () => number) {
  const side = Math.round(Math.sqrt(count));
  const points: [number, number][] = [];
  for (let n = 0; n < side * side; n++) {
    const i = n % side;
    const j = Math.floor(n / side);
    if (method === "random") {
      points.push([random(), random()]);
    } else if (method === "stratified") {
      // 画素を side × side の小区画に分け、各区画の中にランダムに 1 点
      points.push([(i + random()) / side, (j + random()) / side]);
    } else {
      points.push([(i + 0.5) / side, (j + 0.5) / side]);
    }
  }
  return points;
}

/** 回転する三角形の内側か（画素座標）。 */
function inside(x: number, y: number, angle: number) {
  const cx = COLS / 2;
  const cy = ROWS / 2;
  const radius = ROWS * 0.46;
  const corners = [0, 1, 2].map((k) => {
    const a = angle + (k * Math.PI * 2) / 3;
    return [
      cx + Math.cos(a) * radius * 1.3,
      cy + Math.sin(a) * radius,
    ] as const;
  });
  let sign = 0;
  for (let k = 0; k < 3; k++) {
    const [ax, ay] = corners[k] ?? [0, 0];
    const [bx, by] = corners[(k + 1) % 3] ?? [0, 0];
    const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    if (sign === 0) {
      sign = Math.sign(cross);
    } else if (Math.sign(cross) !== sign) {
      return false;
    }
  }
  return true;
}

export const demo: DemoModule = {
  alt: "画素の中に標本点を何個か置いて、図形がその画素をどれだけ覆っているか（被覆率）を見積もり、境目をなめらかにする（アンチエイリアス）デモで、標本点の置き方を比べる。でたらめに置くと、偶然片寄った画素ができて、境目がざらつく。層化サンプリングでは、画素を小さな区画に分け、各区画に 1 点ずつランダムに置くので、片寄りが減り、同じ点の数でも誤差が小さくなる。規則正しい格子に置くと、ざらつきはないが、境目が階段状の縞になる。右は 1 つの画素の拡大で、黄色の点が図形の内側の標本。",
  camera: { position: [0, 0, 11], target: [0, 0, 0], orbit: false, fov: 40 },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "select",
      key: "method",
      label: "標本点の置き方",
      value: "stratified",
      options: [
        { value: "random", label: "でたらめ" },
        { value: "stratified", label: "層化（区画ごとに 1 点）" },
        { value: "grid", label: "規則正しい格子" },
      ],
    },
    {
      type: "range",
      key: "count",
      label: "1 画素の標本数",
      min: 1,
      max: 8,
      step: 1,
      value: 4,
      format: (value) => `${value * value} 点`,
    },
    { type: "toggle", key: "spin", label: "三角形を回す", value: true },
    { type: "toggle", key: "error", label: "誤差を色で表示", value: false },
  ],
  legend: [
    { color: palette.coral, label: "でたらめの誤差" },
    { color: palette.lime, label: "層化の誤差" },
    { color: palette.sky, label: "格子の誤差" },
  ],
  setup(context) {
    const { scene, params } = context;
    const canvas = document.createElement("canvas");
    canvas.width = COLS * CELL + 24 + ZOOM;
    canvas.height = ROWS * CELL;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    const aspect = canvas.width / canvas.height;
    const board = new Mesh(
      new PlaneGeometry(5.6 * aspect, 5.6),
      new MeshBasicMaterial({ map: texture })
    );
    board.position.y = 0.4;
    scene.add(board);
    const graph = historyGraph(context, {
      title: "画素の平均誤差（被覆率）",
      min: 0,
      max: 0.2,
      series: [
        { color: palette.coral },
        { color: palette.lime },
        { color: palette.sky },
      ],
    });

    const random = rng(4);
    let angle = 0.3;
    // 正しい被覆率：画素ごとに 32 × 32 点で調べる
    const truth = (x: number, y: number) => {
      let hits = 0;
      for (let j = 0; j < 32; j++) {
        for (let i = 0; i < 32; i++) {
          if (inside(x + (i + 0.5) / 32, y + (j + 0.5) / 32, angle)) {
            hits++;
          }
        }
      }
      return hits / 1024;
    };
    const estimate = (method: Method, x: number, y: number, count: number) => {
      const points = samplesFor(method, count, random);
      let hits = 0;
      for (const [u, v] of points) {
        if (inside(x + u, y + v, angle)) {
          hits++;
        }
      }
      return { value: hits / points.length, points };
    };

    return {
      update({ dt }) {
        if (params["spin"] === true) {
          angle += dt * 0.15;
        }
        const { method } = params;
        if (
          method !== "random" &&
          method !== "stratified" &&
          method !== "grid"
        ) {
          return;
        }
        const count = Number(params["count"]) ** 2;
        const context2d = canvas.getContext("2d");
        if (!context2d) {
          return;
        }
        const errors: Record<Method, number> = {
          random: 0,
          stratified: 0,
          grid: 0,
        };
        let edges = 0;
        let zoomPixel: [number, number] | null = null;
        let zoomScore = 0.3;
        const showError = params["error"] === true;
        for (let y = 0; y < ROWS; y++) {
          for (let x = 0; x < COLS; x++) {
            // 境目にかかる画素だけ、正しい値との差を調べる
            const corners = [
              inside(x, y, angle),
              inside(x + 1, y, angle),
              inside(x, y + 1, angle),
              inside(x + 1, y + 1, angle),
            ];
            const edge =
              corners.some(Boolean) && corners.some((value) => !value);
            let shown = corners[0] === true ? 1 : 0;
            if (edge) {
              edges++;
              const correct = truth(x, y);
              for (const m of ["random", "stratified", "grid"] as const) {
                const result = estimate(m, x, y, count);
                errors[m] += Math.abs(result.value - correct);
                if (m === method) {
                  shown = showError
                    ? Math.min(1, Math.abs(result.value - correct) * 4)
                    : result.value;
                }
              }
              // 拡大して見せる画素：半分くらい覆われた画素のうち、いちばん半分に近いもの
              if (Math.abs(correct - 0.5) < zoomScore) {
                zoomScore = Math.abs(correct - 0.5);
                zoomPixel = [x, y];
              }
            }
            const v = Math.round(shown * 255);
            context2d.fillStyle =
              showError && edge
                ? `rgb(${v}, ${Math.round(v * 0.35)}, ${Math.round(v * 0.3)})`
                : showError
                  ? "#0f1520"
                  : `rgb(${Math.round(30 + v * 0.8)}, ${Math.round(40 + v * 0.75)}, ${Math.round(60 + v * 0.55)})`;
            context2d.fillRect(x * CELL, y * CELL, CELL, CELL);
          }
        }
        // 1 画素の拡大図：標本点と、内側に入った点
        const ox = COLS * CELL + 24;
        context2d.fillStyle = "#1a2433";
        context2d.fillRect(COLS * CELL, 0, 24 + ZOOM, canvas.height);
        if (zoomPixel) {
          const [px, py] = zoomPixel;
          const top = (canvas.height - ZOOM) / 2;
          const image = context2d.createImageData(ZOOM, ZOOM);
          for (let j = 0; j < ZOOM; j++) {
            for (let i = 0; i < ZOOM; i++) {
              const on = inside(px + i / ZOOM, py + j / ZOOM, angle);
              const o = (j * ZOOM + i) * 4;
              image.data[o] = on ? 120 : 40;
              image.data[o + 1] = on ? 132 : 50;
              image.data[o + 2] = on ? 150 : 68;
              image.data[o + 3] = 255;
            }
          }
          context2d.putImageData(image, ox, top);
          const side = Math.round(Math.sqrt(count));
          if (method === "stratified") {
            context2d.strokeStyle = "rgba(232,238,246,0.35)";
            context2d.lineWidth = 1;
            for (let k = 1; k < side; k++) {
              context2d.beginPath();
              context2d.moveTo(ox + (k / side) * ZOOM, top);
              context2d.lineTo(ox + (k / side) * ZOOM, top + ZOOM);
              context2d.moveTo(ox, top + (k / side) * ZOOM);
              context2d.lineTo(ox + ZOOM, top + (k / side) * ZOOM);
              context2d.stroke();
            }
          }
          const result = estimate(method, px, py, count);
          for (const [u, v] of result.points) {
            const on = inside(px + u, py + v, angle);
            context2d.fillStyle = on ? palette.amber : "#8494aa";
            context2d.beginPath();
            context2d.arc(ox + u * ZOOM, top + v * ZOOM, 6, 0, Math.PI * 2);
            context2d.fill();
          }
          context2d.strokeStyle = palette.coral;
          context2d.lineWidth = 3;
          context2d.strokeRect(px * CELL, py * CELL, CELL, CELL);
          context2d.strokeRect(ox, top, ZOOM, ZOOM);
          context2d.fillStyle = "#e8eef6";
          context2d.font = "18px sans-serif";
          context2d.fillText(
            `見積もり ${(result.value * 100).toFixed(0)}% ／ 正解 ${(truth(px, py) * 100).toFixed(0)}%`,
            ox,
            top - 12
          );
        }
        texture.needsUpdate = true;
        const divisor = Math.max(1, edges);
        graph.push([
          errors.random / divisor,
          errors.stratified / divisor,
          errors.grid / divisor,
        ]);
        context.readout(
          "平均誤差（でたらめ / 層化 / 格子）",
          `${(errors.random / divisor).toFixed(3)} / ${(errors.stratified / divisor).toFixed(3)} / ${(errors.grid / divisor).toFixed(3)}`
        );
        context.caption(
          method === "random"
            ? "でたらめに置くと、偶然、点が片側に寄る画素があり、そこでは被覆率の見積もりが大きく外れる。回転させると、境目がちらちらざらつく。"
            : method === "stratified"
              ? "画素を小区画に分けて、各区画に 1 点ずつ置く（ジッター）。点が画素全体にまんべんなく広がるので、でたらめより誤差が小さい。区画の中ではランダムなので、格子のような縞も出ない。"
              : "格子の中心に規則正しく置くと、どの画素も同じ位置を調べるので、ざらつきはなく、平均の誤差も小さく見える。しかし、誤差が隣の画素とそろって同じ向きに出るので、境目の角度によっては階段状の縞（エイリアシング）として目につく。回転させると縞が動くのがわかる。"
        );
      },
      dispose() {
        texture.dispose();
      },
    };
  },
};
