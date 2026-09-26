import {
  CanvasTexture,
  Color,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";
import { palette, pointCloud, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";

const WIDTH = 16;
const HEIGHT = 9;
const PX_W = 320;
const PX_H = 180;
const MAX_POINTS = 300;

export const demo: DemoModule = {
  alt: "ばらばらに置いた点を、少しずつ均等な間隔に並べ直すポイントリラックス（ロイドの緩和法）のデモ。各点の「なわばり」（ボロノイ領域：その点に一番近い場所の集まり）を求め、点をなわばりの重心へ動かす。これをくり返すと、近すぎた点は離れ、すき間は埋まり、なわばりの大きさがそろっていく。赤い矢印が点から重心への移動。数回で、でたらめな並びが、ほどよくばらついた均等な並びになる。",
  camera: { position: [0, 0, 13.5], target: [0, 0, 0], orbit: false, fov: 40 },
  studio: { floor: false, fog: false, background: "#1a2433" },
  controls: [
    {
      type: "range",
      key: "count",
      label: "点の数",
      min: 10,
      max: MAX_POINTS,
      step: 5,
      value: 90,
    },
    {
      type: "range",
      key: "rate",
      label: "重心へ動かす割合",
      min: 0.1,
      max: 1,
      step: 0.05,
      value: 1,
    },
    {
      type: "range",
      key: "interval",
      label: "1 回の間隔（秒）",
      min: 0.1,
      max: 2,
      step: 0.05,
      value: 0.7,
    },
    {
      type: "select",
      key: "start",
      label: "最初の並び",
      value: "random",
      options: [
        { value: "random", label: "でたらめ" },
        { value: "cluster", label: "かたまり" },
        { value: "grid", label: "格子（少しずらす）" },
      ],
    },
    {
      type: "toggle",
      key: "cells",
      label: "なわばり（ボロノイ領域）を表示",
      value: true,
    },
    { type: "button", key: "reset", label: "並べ直して最初から" },
  ],
  legend: [
    { color: palette.ink, label: "点" },
    { color: palette.coral, label: "なわばりの重心への移動" },
  ],
  setup(context) {
    const { scene, params } = context;
    const canvas = document.createElement("canvas");
    canvas.width = PX_W;
    canvas.height = PX_H;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    const board = new Mesh(
      new PlaneGeometry(WIDTH, HEIGHT),
      new MeshBasicMaterial({ map: texture })
    );
    scene.add(board);
    const dots = pointCloud(MAX_POINTS, { size: 22, color: palette.ink });
    dots.position.z = 0.02;
    scene.add(dots);
    const arrows = segments([], palette.coral, { width: 2.5 });
    arrows.position.z = 0.01;
    scene.add(arrows);

    let points: { x: number; y: number }[] = [];
    let seed = 1;
    let signature = "";
    let iteration = 0;
    let clock = 0;
    let owner = new Int32Array(PX_W * PX_H);
    let centroids: { x: number; y: number }[] = [];

    const reset = () => {
      const random = rng(seed);
      const count = Number(params["count"]);
      const start = String(params["start"]);
      points = Array.from({ length: count }, (_, index) => {
        if (start === "cluster") {
          const angle = random() * Math.PI * 2;
          const radius = random() ** 2 * 3;
          return {
            x: -3 + Math.cos(angle) * radius,
            y: 1 + Math.sin(angle) * radius * 0.7,
          };
        }
        if (start === "grid") {
          const columns = Math.ceil(Math.sqrt((count * WIDTH) / HEIGHT));
          const rows = Math.ceil(count / columns);
          return {
            x:
              ((index % columns) + 0.5) * (WIDTH / columns) -
              WIDTH / 2 +
              (random() - 0.5) * 0.3,
            y:
              (Math.floor(index / columns) + 0.5) * (HEIGHT / rows) -
              HEIGHT / 2 +
              (random() - 0.5) * 0.3,
          };
        }
        return { x: (random() - 0.5) * WIDTH, y: (random() - 0.5) * HEIGHT };
      });
      iteration = 0;
      clock = 0;
    };

    /** 画素ごとに一番近い点を求め、なわばりと重心を計算する。 */
    const computeCells = () => {
      owner = new Int32Array(PX_W * PX_H);
      const sums = points.map(() => ({ x: 0, y: 0, n: 0 }));
      for (let py = 0; py < PX_H; py++) {
        const y = HEIGHT / 2 - ((py + 0.5) / PX_H) * HEIGHT;
        for (let px = 0; px < PX_W; px++) {
          const x = ((px + 0.5) / PX_W) * WIDTH - WIDTH / 2;
          let best = 0;
          let bestDistance = Number.POSITIVE_INFINITY;
          for (const [index, point] of points.entries()) {
            const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
            if (distance < bestDistance) {
              bestDistance = distance;
              best = index;
            }
          }
          owner[py * PX_W + px] = best;
          const sum = sums[best];
          if (sum) {
            sum.x += x;
            sum.y += y;
            sum.n++;
          }
        }
      }
      centroids = sums.map((sum, index) =>
        sum.n > 0
          ? { x: sum.x / sum.n, y: sum.y / sum.n }
          : (points[index] ?? { x: 0, y: 0 })
      );
      const areas = sums.map((sum) => sum.n);
      const mean =
        areas.reduce((total, value) => total + value, 0) /
        Math.max(1, areas.length);
      const deviation = Math.sqrt(
        areas.reduce((total, value) => total + (value - mean) ** 2, 0) /
          Math.max(1, areas.length)
      );
      return deviation / Math.max(1, mean);
    };

    const paint = () => {
      const context2d = canvas.getContext("2d");
      if (!context2d) {
        return;
      }
      const image = context2d.createImageData(PX_W, PX_H);
      const color = new Color();
      const showCells = params["cells"] === true;
      for (let index = 0; index < PX_W * PX_H; index++) {
        const cell = owner[index] ?? 0;
        const px = index % PX_W;
        const edge =
          showCells &&
          ((px + 1 < PX_W && owner[index + 1] !== cell) ||
            (index + PX_W < PX_W * PX_H && owner[index + PX_W] !== cell));
        if (!showCells) {
          color.set("#223047");
        } else if (edge) {
          color.set("#10161f");
        } else {
          color.setHSL(
            ((cell * 0.618) % 1) * 0.35 + 0.5,
            0.35,
            0.3 + ((cell * 0.37) % 1) * 0.12
          );
        }
        image.data[index * 4] = color.r * 255;
        image.data[index * 4 + 1] = color.g * 255;
        image.data[index * 4 + 2] = color.b * 255;
        image.data[index * 4 + 3] = 255;
      }
      context2d.putImageData(image, 0, 0);
      texture.needsUpdate = true;
    };

    const drawPoints = () => {
      for (const [index, point] of points.entries()) {
        dots.positions.set([point.x, point.y, 0], index * 3);
      }
      dots.geometry.setDrawRange(0, points.length);
      dots.commit();
      const lines: Vector3[] = [];
      for (const [index, point] of points.entries()) {
        const target = centroids[index];
        if (
          target &&
          Math.hypot(target.x - point.x, target.y - point.y) > 0.02
        ) {
          lines.push(
            new Vector3(point.x, point.y, 0),
            new Vector3(target.x, target.y, 0)
          );
        }
      }
      arrows.setPoints(lines);
    };

    const minimumDistance = () => {
      let smallest = Number.POSITIVE_INFINITY;
      for (let a = 0; a < points.length; a++) {
        for (let b = a + 1; b < points.length; b++) {
          const pa = points[a];
          const pb = points[b];
          if (pa && pb) {
            smallest = Math.min(smallest, Math.hypot(pa.x - pb.x, pa.y - pb.y));
          }
        }
      }
      return smallest;
    };

    let spread = 0;
    return {
      action(key) {
        if (key === "reset") {
          seed++;
          signature = "";
        }
      },
      update({ dt }) {
        const key = [params["count"], params["start"], seed].join("|");
        if (key !== signature) {
          signature = key;
          reset();
          spread = computeCells();
          paint();
          drawPoints();
        }
        clock += dt;
        if (clock > Number(params["interval"]) && iteration < 60) {
          clock = 0;
          // 点をなわばりの重心へ動かしてから、なわばりを計算し直す
          const rate = Number(params["rate"]);
          points = points.map((point, index) => {
            const target = centroids[index] ?? point;
            return {
              x: point.x + (target.x - point.x) * rate,
              y: point.y + (target.y - point.y) * rate,
            };
          });
          iteration++;
          spread = computeCells();
          paint();
          drawPoints();
        } else if (iteration >= 60 && clock > 3) {
          seed++;
          signature = "";
        }
        context.readout("くり返し", `${iteration} 回`);
        context.readout(
          "いちばん近い 2 点の距離",
          minimumDistance().toFixed(2)
        );
        context.readout(
          "なわばりの大きさのばらつき",
          `${Math.round(spread * 100)}%`
        );
        context.caption(
          iteration === 0
            ? "でたらめに置いた点は、近すぎる所と大きなすき間ができる。色分けした領域が各点のなわばり（ボロノイ領域）で、赤い線がなわばりの重心への移動。"
            : "点をなわばりの重心へ動かすと、混んだ所の点は外へ、すき間の近くの点はすき間へ引っぱられる。くり返すほど、なわばりの大きさがそろい、いちばん近い 2 点の距離が広がっていく。"
        );
      },
      dispose() {
        texture.dispose();
      },
    };
  },
};
