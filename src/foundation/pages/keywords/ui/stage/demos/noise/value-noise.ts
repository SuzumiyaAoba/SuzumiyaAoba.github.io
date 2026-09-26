import {
  CylinderGeometry,
  InstancedMesh,
  Matrix4,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";
import { hash3, palette, ramp, smoothstep, standard } from "../../kit";
import { gridTerrain } from "../../surface";
import type { DemoModule } from "../../types";

const SIZE = 8;
const MAX_CELLS = 10;
const HEIGHT = 1.8;

const interpolate = (a: number, b: number, t: number, mode: string) => {
  if (mode === "nearest") {
    return t < 0.5 ? a : b;
  }
  const w = mode === "linear" ? t : t * t * (3 - 2 * t);
  return a + (b - a) * w;
};

export const demo: DemoModule = {
  alt: "格子点に立てたピンの高さが乱数で決まり、その間を補間して地形の面を作る値ノイズのデモ。補間方法を最近傍・線形・スムーズと切り替えると、段差、折れ目、滑らかな起伏へと変わる。",
  camera: { position: [7.2, 6.4, 8.2], target: [0, 0.6, 0] },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "格子点の間の補間",
      value: "smooth",
      options: [
        { value: "nearest", label: "最近傍" },
        { value: "linear", label: "線形" },
        { value: "smooth", label: "スムーズ" },
      ],
      hint: "スムーズは smoothstep（3t²−2t³）で重みを付けます。",
    },
    {
      type: "range",
      key: "cells",
      label: "格子の数",
      min: 2,
      max: MAX_CELLS,
      step: 1,
      value: 5,
    },
    { type: "toggle", key: "animate", label: "時間方向にも補間", value: true },
    { type: "toggle", key: "pins", label: "格子点の値（ピン）", value: true },
    { type: "button", key: "reseed", label: "乱数を振り直す" },
  ],
  legend: [
    { color: palette.amber, label: "格子点の乱数値" },
    { color: palette.cyan, label: "補間された面" },
  ],
  setup(context) {
    const { scene, params } = context;
    const terrain = gridTerrain({ width: SIZE, segments: 140 });
    scene.add(terrain);

    const count = (MAX_CELLS + 1) * (MAX_CELLS + 1);
    const poles = new InstancedMesh(
      new CylinderGeometry(0.018, 0.018, 1, 8),
      standard(palette.amber, { emissive: 0.3 }),
      count
    );
    const heads = new InstancedMesh(
      new SphereGeometry(0.075, 16, 12),
      standard(palette.amber, { emissive: 0.7, roughness: 0.3 }),
      count
    );
    poles.castShadow = true;
    heads.castShadow = true;
    scene.add(poles, heads);

    const matrix = new Matrix4();
    const scale = new Vector3();
    const identity = new Quaternion();
    const position = new Vector3();
    let seed = 1;
    let clock = 0;
    let lastKey = "";

    const latticeValue = (i: number, j: number, time: number) => {
      const k = Math.floor(time);
      const a = hash3(i + seed * 17, j, k);
      const b = hash3(i + seed * 17, j, k + 1);
      return a + (b - a) * smoothstep(0, 1, time - k);
    };

    return {
      action(key) {
        if (key === "reseed") {
          seed += 1;
        }
      },
      update({ dt }) {
        const mode = String(params["mode"]);
        const cells = Number(params["cells"]);
        if (params["animate"] === true) {
          clock += dt * 0.35;
        }
        const key = `${mode}:${cells}:${seed}:${clock.toFixed(4)}`;
        if (key === lastKey) {
          return;
        }
        lastKey = key;
        const cell = SIZE / cells;
        const values: number[] = [];
        for (let j = 0; j <= cells; j++) {
          for (let i = 0; i <= cells; i++) {
            values.push(latticeValue(i, j, clock));
          }
        }
        const at = (i: number, j: number) =>
          values[Math.min(cells, j) * (cells + 1) + Math.min(cells, i)] ?? 0;
        const height = (x: number, z: number) => {
          const u = (x + SIZE / 2) / cell;
          const v = (z + SIZE / 2) / cell;
          const i = Math.min(cells - 1, Math.floor(u));
          const j = Math.min(cells - 1, Math.floor(v));
          const fu = u - i;
          const fv = v - j;
          const top = interpolate(at(i, j), at(i + 1, j), fu, mode);
          const bottom = interpolate(at(i, j + 1), at(i + 1, j + 1), fu, mode);
          return interpolate(top, bottom, fv, mode) * HEIGHT;
        };
        terrain.update(height, (_x, _z, h, out) => {
          out.copy(
            ramp(h / HEIGHT, ["#1e2a5a", "#2c6f8f", palette.cyan, "#e9f1e6"])
          );
        });

        const showPins = params["pins"] === true;
        let used = 0;
        if (showPins) {
          for (let j = 0; j <= cells; j++) {
            for (let i = 0; i <= cells; i++) {
              const value = at(i, j) * HEIGHT;
              const x = i * cell - SIZE / 2;
              const z = j * cell - SIZE / 2;
              matrix.compose(
                position.set(x, value / 2, z),
                identity,
                scale.set(1, Math.max(0.001, value), 1)
              );
              poles.setMatrixAt(used, matrix);
              matrix.makeTranslation(x, value, z);
              heads.setMatrixAt(used, matrix);
              used++;
            }
          }
        }
        poles.count = used;
        heads.count = used;
        poles.instanceMatrix.needsUpdate = true;
        heads.instanceMatrix.needsUpdate = true;

        context.readout("格子点の数", `${(cells + 1) ** 2} 個`);
        context.readout("格子点 (0,0) の値", at(0, 0).toFixed(3));
        context.caption(
          mode === "nearest"
            ? "最近傍：一番近い格子点の値をそのまま使う。値は連続せず、段差のブロックになる。"
            : mode === "linear"
              ? "線形補間：値はつながるが、傾きが格子線で急に変わり、折れ目が見える。"
              : "スムーズ補間：格子点で傾きが 0 になる重みを使い、折れ目のない柔らかな起伏になる。"
        );
      },
    };
  },
};
