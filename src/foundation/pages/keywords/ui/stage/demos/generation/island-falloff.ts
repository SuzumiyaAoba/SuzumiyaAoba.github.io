import {
  BufferAttribute,
  Color,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from "three";
import { fbm2, palette, smoothstep, terrainColor } from "../../kit";
import type { DemoModule } from "../../types";

const SIZE = 9;
const N = 160;
const SEA = 0.36;
const HEIGHT = 2.4;

/** 中心からの「距離」（0 が中心、1 が端）。形ごとに測り方が違う。 */
function distanceFor(shape: string, u: number, v: number, warp: number) {
  if (shape === "square") {
    return Math.max(Math.abs(u), Math.abs(v));
  }
  if (shape === "rounded") {
    return (u ** 4 + v ** 4) ** 0.25;
  }
  if (shape === "warped") {
    // 座標をノイズでずらした円：入り江や岬のある形になる
    return Math.hypot(
      u + warp * fbm2(u * 1.3 + 7, v * 1.3, 3),
      v + warp * fbm2(u * 1.3, v * 1.3 + 3, 3)
    );
  }
  return Math.hypot(u, v);
}

export const demo: DemoModule = {
  alt: "ノイズで作った地形に、中心から離れるほど低くなるマスク（減衰マスク）を掛けて、海に囲まれた島の形に整えるデモ。ノイズだけの地形は、マップの端で陸地が途切れてしまう。中心からの距離で高さを下げると、端は必ず海になり、島の輪郭はノイズの凸凹を残したまま自然な海岸線になる。距離の測り方（円・四角・角の丸い四角・ゆがめた円）で島の形が変わる。右下の図は、中央の横一列のノイズ・マスク・結果の高さ。",
  camera: { position: [0, 7.2, 8.4], target: [0, -0.2, 0], fov: 42 },
  studio: { floor: false },
  controls: [
    {
      type: "range",
      key: "strength",
      label: "マスクの強さ（0 でなし）",
      min: 0,
      max: 1.5,
      step: 0.05,
      value: 1,
    },
    {
      type: "select",
      key: "shape",
      label: "距離の測り方",
      value: "warped",
      options: [
        { value: "circle", label: "円" },
        { value: "square", label: "四角" },
        { value: "rounded", label: "角の丸い四角" },
        { value: "warped", label: "ノイズでゆがめた円" },
      ],
    },
    {
      type: "range",
      key: "inner",
      label: "下がり始める距離",
      min: 0,
      max: 0.9,
      step: 0.02,
      value: 0.35,
    },
    {
      type: "range",
      key: "power",
      label: "下がり方のカーブ",
      min: 0.3,
      max: 4,
      step: 0.05,
      value: 1.3,
    },
    {
      type: "range",
      key: "seed",
      label: "ノイズの種",
      min: 0,
      max: 20,
      step: 1,
      value: 3,
    },
    {
      type: "toggle",
      key: "overlay",
      label: "マスクを地形に重ねて表示",
      value: false,
    },
  ],
  legend: [
    { color: "#b0b8c4", label: "ノイズ（元の高さ）" },
    { color: palette.coral, label: "マスク（中心 1 → 端 0）" },
    { color: palette.lime, label: "結果の高さ" },
  ],
  setup(context) {
    const { scene, params } = context;
    const geometry = new PlaneGeometry(SIZE, SIZE, N - 1, N - 1);
    geometry.rotateX(-Math.PI / 2);
    const colors = new Float32Array(N * N * 3);
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    const terrain = new Mesh(
      geometry,
      new MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.9,
        flatShading: false,
      })
    );
    terrain.castShadow = true;
    terrain.receiveShadow = true;
    scene.add(terrain);
    const water = new Mesh(
      new PlaneGeometry(SIZE * 1.6, SIZE * 1.6),
      new MeshStandardMaterial({
        color: "#2a6f9e",
        transparent: true,
        opacity: 0.72,
        roughness: 0.15,
        metalness: 0.1,
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.001;
    scene.add(water);

    const canvas = document.createElement("canvas");
    canvas.width = 440;
    canvas.height = 180;
    canvas.style.width = "220px";
    canvas.style.height = "90px";
    const figure = document.createElement("figure");
    figure.className = "keyword-stage-graph";
    const caption = document.createElement("figcaption");
    caption.textContent = "中央の一列の断面";
    figure.append(caption, canvas);
    context.hud(figure);

    let signature = "";
    const noise = new Float32Array(N * N);
    const mask = new Float32Array(N * N);
    const result = new Float32Array(N * N);
    const color = new Color();
    const maskColor = new Color(palette.coral);

    const build = () => {
      const seed = Number(params["seed"]);
      const shape = String(params["shape"]);
      const inner = Number(params["inner"]);
      const power = Number(params["power"]);
      const strength = Number(params["strength"]);
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const u = (i / (N - 1)) * 2 - 1;
          const v = (j / (N - 1)) * 2 - 1;
          const index = j * N + i;
          const n =
            fbm2(u * 2.2 + seed * 13.1, v * 2.2 - seed * 7.7, 6) * 0.9 + 0.5;
          // マスク：下がり始める距離から端（距離 1）までを、なめらかに 1 → 0 へ
          const d = distanceFor(shape, u, v, 0.35);
          const falloff = (1 - smoothstep(inner, 1, d)) ** power;
          noise[index] = n;
          mask[index] = falloff;
          // マスクの強さに応じて、端ほど高さを引き下げる
          result[index] =
            n - (1 - falloff) * strength * 0.75 + (strength > 0 ? 0.08 : 0);
        }
      }
      const positions = geometry.getAttribute("position");
      for (let index = 0; index < N * N; index++) {
        const h = result[index] ?? 0;
        positions.setY(index, (h - SEA) * HEIGHT * (h < SEA ? 0.4 : 1));
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      const normals = geometry.getAttribute("normal");
      const overlay = params["overlay"] === true;
      for (let index = 0; index < N * N; index++) {
        terrainColor(result[index] ?? 0, 1 - normals.getY(index), color);
        if (overlay) {
          color.lerp(maskColor, (1 - (mask[index] ?? 0)) * 0.7);
        }
        colors.set([color.r, color.g, color.b], index * 3);
      }
      geometry.getAttribute("color").needsUpdate = true;
      // 断面の図
      const context2d = canvas.getContext("2d");
      if (context2d) {
        context2d.clearRect(0, 0, canvas.width, canvas.height);
        const row = Math.floor(N / 2) * N;
        const yOf = (value: number) =>
          canvas.height -
          14 -
          Math.max(-0.2, Math.min(1.2, value)) * (canvas.height - 30);
        context2d.strokeStyle = "#3b7fc4";
        context2d.lineWidth = 2;
        context2d.setLineDash([6, 6]);
        context2d.beginPath();
        context2d.moveTo(0, yOf(SEA));
        context2d.lineTo(canvas.width, yOf(SEA));
        context2d.stroke();
        context2d.setLineDash([]);
        for (const [values, stroke] of [
          [noise, "#b0b8c4"],
          [mask, palette.coral],
          [result, palette.lime],
        ] as const) {
          context2d.strokeStyle = stroke;
          context2d.lineWidth = 4;
          context2d.beginPath();
          for (let i = 0; i < N; i++) {
            const x = (i / (N - 1)) * canvas.width;
            const y = yOf(values[row + i] ?? 0);
            if (i === 0) {
              context2d.moveTo(x, y);
            } else {
              context2d.lineTo(x, y);
            }
          }
          context2d.stroke();
        }
      }
      let land = 0;
      let edgeLand = 0;
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const above = (result[j * N + i] ?? 0) > SEA;
          if (above) {
            land++;
            if (i === 0 || j === 0 || i === N - 1 || j === N - 1) {
              edgeLand++;
            }
          }
        }
      }
      context.readout("陸地の割合", `${Math.round((land / (N * N)) * 100)}%`);
      context.readout("マップの端にかかった陸地", `${edgeLand} マス`);
    };

    return {
      update() {
        const key = ["strength", "shape", "inner", "power", "seed", "overlay"]
          .map((name) => String(params[name]))
          .join("|");
        if (key !== signature) {
          signature = key;
          build();
        }
        context.caption(
          Number(params["strength"]) === 0
            ? "マスクなし：ノイズの高さをそのまま使うと、陸地がマップの端で切れてしまい、島ではなく大陸の一部を切り取ったように見える。"
            : "中心からの距離で「下がり始める距離」より外側の高さを引き下げる。ノイズの凸凹は残るので、海岸線は円や四角のままにはならず、入り江や岬のある自然な形になる。"
        );
      },
    };
  },
};
