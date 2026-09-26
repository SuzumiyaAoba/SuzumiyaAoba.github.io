import { Vector3 } from "three";
import { palette, perlin2, polyline, terrainColor } from "../../kit";
import { gridTerrain } from "../../surface";
import type { DemoModule } from "../../types";

const SIZE = 8;
const BASE_CELL = 4;
const HEIGHT = 2.4;
const MAX_OCTAVES = 8;
const CHART_Z = -4.6;
const CHART_TOP = 5.2;
const CHART_STEP = 0.52;
const SAMPLES = 220;

const octaveColors = [
  palette.coral,
  palette.amber,
  palette.lime,
  palette.cyan,
  palette.sky,
  palette.violet,
  palette.pink,
  palette.ink,
];

export const demo: DemoModule = {
  alt: "周波数を 2 倍、振幅を半分にしたノイズを重ねていくフラクタルブラウン運動の山岳地形。奥のグラフには各オクターブの波形が積み上げて表示され、重ねるほど地形に細部が増える。",
  camera: { position: [7.6, 6.2, 9.2], target: [0, 1.6, -1] },
  controls: [
    {
      type: "range",
      key: "octaves",
      label: "オクターブ数",
      min: 1,
      max: MAX_OCTAVES,
      step: 1,
      value: 5,
    },
    {
      type: "range",
      key: "lacunarity",
      label: "ラクナリティ（周波数の倍率）",
      min: 1.5,
      max: 3,
      step: 0.05,
      value: 2,
    },
    {
      type: "range",
      key: "gain",
      label: "ゲイン（振幅の倍率）",
      min: 0.25,
      max: 0.75,
      step: 0.01,
      value: 0.5,
      hint: "大きいほど細かい起伏が強く残り、ざらついた地形になります。",
    },
    { type: "toggle", key: "chart", label: "オクターブの波形", value: true },
  ],
  legend: [
    { color: palette.coral, label: "第 1 オクターブ（大きな起伏）" },
    { color: palette.violet, label: "高いオクターブ（細部）" },
    { color: palette.amber, label: "z = 0 の断面" },
  ],
  setup(context) {
    const { scene, params } = context;
    const terrain = gridTerrain({ width: SIZE, segments: 180 });
    scene.add(terrain);
    const section = polyline([], palette.amber, { width: 2.5 });
    scene.add(section);
    const waves = Array.from({ length: MAX_OCTAVES + 1 }, (_, index) => {
      const line = polyline([], octaveColors[index] ?? palette.ink, {
        width: index === MAX_OCTAVES ? 3 : 1.8,
      });
      scene.add(line);
      return line;
    });
    const labels = Array.from({ length: MAX_OCTAVES + 1 }, (_, index) => {
      const item = context.label(
        index === MAX_OCTAVES ? "合計" : `${index + 1}`,
        {
          color: index === MAX_OCTAVES ? palette.amber : octaveColors[index],
          tone: "muted",
        }
      );
      scene.add(item);
      return item;
    });
    let lastKey = "";

    return {
      update() {
        const octaves = Number(params["octaves"]);
        const lacunarity = Number(params["lacunarity"]);
        const gain = Number(params["gain"]);
        const showChart = params["chart"] === true;
        const key = `${octaves}:${lacunarity}:${gain}:${showChart}`;
        if (key === lastKey) {
          return;
        }
        lastKey = key;

        const octave = (index: number, x: number, z: number) => {
          const frequency = lacunarity ** index / BASE_CELL;
          return (
            perlin2(x * frequency + index * 13.1, z * frequency - index * 7.7) *
            gain ** index
          );
        };
        let norm = 0;
        for (let index = 0; index < octaves; index++) {
          norm += gain ** index;
        }
        const height = (x: number, z: number) => {
          let sum = 0;
          for (let index = 0; index < octaves; index++) {
            sum += octave(index, x, z);
          }
          return ((sum / norm) * 1.6 + 0.35) * HEIGHT;
        };
        terrain.update(height, (x, z, h, out) => {
          const slope = Math.min(
            1,
            Math.hypot(height(x + 0.04, z) - h, height(x, z + 0.04) - h) /
              0.04 /
              2.2
          );
          terrainColor(h / (HEIGHT * 1.6) + 0.2, slope, out);
        });

        const profile: Vector3[] = [];
        for (let sample = 0; sample <= SAMPLES; sample++) {
          const x = (sample / SAMPLES - 0.5) * SIZE;
          profile.push(new Vector3(x, height(x, 0) + 0.03, 0));
        }
        section.setPoints(profile);

        for (let index = 0; index <= MAX_OCTAVES; index++) {
          const line = waves[index];
          const label = labels[index];
          if (!(line && label)) {
            continue;
          }
          const isSum = index === MAX_OCTAVES;
          const visible = showChart && (isSum || index < octaves);
          line.visible = visible;
          label.visible = visible;
          if (!visible) {
            continue;
          }
          const row = isSum ? octaves : index;
          const baseline = CHART_TOP - row * CHART_STEP;
          const points: Vector3[] = [];
          for (let sample = 0; sample <= SAMPLES; sample++) {
            const x = (sample / SAMPLES - 0.5) * SIZE;
            const value = isSum
              ? (height(x, 0) / HEIGHT - 0.35) * 0.45
              : octave(index, x, 0) * 0.55;
            points.push(new Vector3(x, baseline + value, CHART_Z));
          }
          line.setPoints(points);
          label.position.set(-SIZE / 2 - 0.35, baseline, CHART_Z);
        }

        const finest = BASE_CELL / lacunarity ** (octaves - 1);
        context.readout("最も細かい格子", `${finest.toFixed(3)} m`);
        context.readout(
          "最後の層の振幅",
          `${(gain ** (octaves - 1) * 100).toFixed(1)} %`
        );
        context.caption(
          octaves === 1
            ? "1 オクターブだけでは丸い丘が並ぶだけ。自然の地形にしては単調すぎる。"
            : `周波数を ${lacunarity.toFixed(2)} 倍、振幅を ${gain.toFixed(2)} 倍にしながら ${octaves} 層を合計。大きな山並みと細かな岩肌が同時に現れる。`
        );
      },
    };
  },
};
