import { Vector3 } from "three";
import { clamp, palette, perlin2, polyline, terrainColor } from "../../kit";
import { gridTerrain } from "../../surface";
import type { DemoModule } from "../../types";

const SIZE = 9;
const HEIGHT = 2.3;
const SAMPLES = 200;

type Settings = { ridged: boolean; octaves: number; sharpness: number };

function elevation(x: number, z: number, settings: Settings) {
  let sum = 0;
  let amplitude = 1;
  let frequency = 1 / 4.6;
  let weight = 1;
  let norm = 0;
  for (let index = 0; index < settings.octaves; index++) {
    const n =
      perlin2(x * frequency + index * 5.3, z * frequency - index * 3.1) * 1.4;
    let signal: number;
    if (settings.ridged) {
      // 0 を横切る場所（|n| が 0）を尾根にして、尖らせる。
      signal = (1 - Math.abs(n)) ** settings.sharpness;
      signal *= weight;
      weight = clamp(signal * 1.6);
    } else {
      signal = n * 0.5 + 0.5;
    }
    sum += signal * amplitude;
    norm += amplitude;
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  const value = sum / norm;
  return settings.ridged ? (value - 0.28) * 1.45 : value * 1.3 - 0.35;
}

export const demo: DemoModule = {
  alt: "山岳地形の比較デモ。通常のフラクタルノイズでは丸い丘が並ぶが、リッジノイズに切り替えると鋭い尾根が連なる山脈になり、尾根の線が強調表示される。",
  camera: { position: [8, 6.4, 8.6], target: [0, 0.8, 0] },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "ノイズ",
      value: "ridged",
      options: [
        { value: "fbm", label: "通常の fBm" },
        { value: "ridged", label: "リッジ（稜線）" },
      ],
    },
    {
      type: "range",
      key: "octaves",
      label: "オクターブ数",
      min: 1,
      max: 7,
      step: 1,
      value: 6,
    },
    {
      type: "range",
      key: "sharpness",
      label: "尾根の鋭さ（指数）",
      min: 1,
      max: 4,
      step: 0.1,
      value: 2,
      hint: "(1 − |n|) を何乗するか。大きいほど尾根が細く尖ります。",
    },
    { type: "toggle", key: "section", label: "断面を表示", value: true },
  ],
  legend: [{ color: palette.amber, label: "x 方向の断面" }],
  setup(context) {
    const { scene, params } = context;
    const terrain = gridTerrain({ width: SIZE, segments: 200 });
    scene.add(terrain);
    const section = polyline([], palette.amber, { width: 2.5 });
    scene.add(section);
    let lastKey = "";

    return {
      update() {
        const settings: Settings = {
          ridged: params["mode"] === "ridged",
          octaves: Number(params["octaves"]),
          sharpness: Number(params["sharpness"]),
        };
        const key = `${settings.ridged}:${settings.octaves}:${settings.sharpness}`;
        section.visible = params["section"] === true;
        if (key === lastKey) {
          return;
        }
        lastKey = key;
        const height = (x: number, z: number) =>
          Math.max(0, elevation(x, z, settings)) * HEIGHT;
        terrain.update(height, (x, z, h, out) => {
          const slope = Math.min(
            1,
            Math.hypot(height(x + 0.04, z) - h, height(x, z + 0.04) - h) /
              0.04 /
              4
          );
          terrainColor(h <= 0 ? 0.25 : 0.38 + (h / HEIGHT) * 0.62, slope, out);
        });
        const points: Vector3[] = [];
        for (let sample = 0; sample <= SAMPLES; sample++) {
          const x = (sample / SAMPLES - 0.5) * SIZE;
          points.push(new Vector3(x, height(x, 1.2) + 0.04, 1.2));
        }
        section.setPoints(points);
        context.caption(
          settings.ridged
            ? "1 − |ノイズ| を累乗すると、ノイズが 0 を横切る線が細く尖った尾根になる。前の層の値で次の層を重み付けし、谷は滑らかに保つ。"
            : "通常の fBm は山も谷も同じ丸さ。なだらかな丘陵には向くが、険しい山脈には見えない。"
        );
      },
    };
  },
};
