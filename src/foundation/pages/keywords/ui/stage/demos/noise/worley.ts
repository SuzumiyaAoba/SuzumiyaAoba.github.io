import { InstancedMesh, Matrix4, SphereGeometry, Vector2 } from "three";
import { glslHash } from "../../glsl";
import { hash2, palette, standard, TAU } from "../../kit";
import { heightSurface } from "../../surface";
import type { DemoModule } from "../../types";

const GRID = 9;
const CELL = 1;
const SIZE = GRID * CELL;

const modes = {
  cells: 0,
  stones: 1,
  cracks: 2,
} as const;

export const demo: DemoModule = {
  alt: "散らばった特徴点までの距離から面を作るウォーリーノイズのデモ。最も近い点までの距離で細胞状の模様、1 番目と 2 番目の距離の差で石畳や溶岩のひび割れになる。",
  camera: { position: [6.4, 7.2, 7.4], target: [0, 0, 0] },
  bloom: { strength: 0.7, radius: 0.25, threshold: 0.9 },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "使い方",
      value: "stones",
      options: [
        { value: "cells", label: "F1：細胞" },
        { value: "stones", label: "F2−F1：石畳" },
        { value: "cracks", label: "F2−F1：溶岩のひび" },
      ],
    },
    {
      type: "range",
      key: "jitter",
      label: "特徴点のばらつき",
      min: 0,
      max: 1,
      step: 0.05,
      value: 0.85,
      hint: "0 にすると点が格子に揃い、規則的なタイルになります。",
    },
    { type: "toggle", key: "move", label: "特徴点を動かす", value: false },
    { type: "toggle", key: "points", label: "特徴点を表示", value: true },
  ],
  legend: [{ color: palette.cyan, label: "特徴点" }],
  setup(context) {
    const { scene, params } = context;
    const features = Array.from({ length: GRID * GRID }, () => new Vector2());
    const uniforms = {
      uMode: { value: 1 },
    };
    const surface = heightSurface({
      width: SIZE,
      segments: 320,
      uniforms,
      rawUniforms: { uFeatures: { value: features } },
      emissive: true,
      functions: /* glsl */ `
        ${glslHash}
        uniform vec2 uFeatures[${GRID * GRID}];
        const float GRID = ${GRID}.0;
        vec3 worley(vec2 p) {
          vec2 q = p / ${CELL.toFixed(1)} + GRID * 0.5;
          vec2 i = floor(q);
          vec2 f = q - i;
          float f1 = 9.0;
          float f2 = 9.0;
          float id = 0.0;
          for (int y = -1; y <= 1; y++) {
            for (int x = -1; x <= 1; x++) {
              vec2 cell = i + vec2(float(x), float(y));
              vec2 wrapped = mod(cell, GRID);
              int index = int(wrapped.y) * ${GRID} + int(wrapped.x);
              vec2 feature = vec2(float(x), float(y)) + uFeatures[index];
              float d = length(feature - f);
              if (d < f1) {
                f2 = f1;
                f1 = d;
                id = hash12(wrapped + 3.7);
              } else if (d < f2) {
                f2 = d;
              }
            }
          }
          return vec3(f1, f2, id);
        }
        float surfaceHeight(vec2 p) {
          vec3 w = worley(p);
          if (uMode < 0.5) return w.x * 0.55;
          float edge = w.y - w.x;
          if (uMode < 1.5) return 0.22 * smoothstep(0.02, 0.16, edge) + w.z * 0.06;
          return 0.28 * smoothstep(0.0, 0.22, edge);
        }
        vec3 surfaceColor(vec2 p, float h, vec3 n) {
          vec3 w = worley(p);
          float edge = w.y - w.x;
          if (uMode < 0.5) {
            vec3 inner = vec3(0.10, 0.62, 0.62);
            vec3 outer = vec3(0.10, 0.12, 0.30);
            vec3 color = mix(inner, outer, smoothstep(0.0, 0.8, w.x));
            return mix(color, vec3(0.95, 0.75, 0.40), (1.0 - smoothstep(0.0, 0.04, edge)) * 0.8);
          }
          if (uMode < 1.5) {
            vec3 stone = mix(vec3(0.42, 0.40, 0.37), vec3(0.62, 0.58, 0.50), w.z);
            stone *= 0.85 + 0.15 * hash12(floor(p * 40.0));
            vec3 grout = vec3(0.16, 0.15, 0.14);
            return mix(grout, stone, smoothstep(0.03, 0.1, edge));
          }
          vec3 rock = mix(vec3(0.10, 0.09, 0.09), vec3(0.22, 0.19, 0.18), w.z);
          return mix(vec3(0.3, 0.08, 0.02), rock, smoothstep(0.0, 0.09, edge));
        }
        vec3 surfaceEmission(vec2 p, float h) {
          if (uMode < 1.5) return vec3(0.0);
          vec3 w = worley(p);
          float edge = w.y - w.x;
          return vec3(1.3, 0.55, 0.12) * (1.0 - smoothstep(0.0, 0.07, edge));
        }
      `,
    });
    scene.add(surface);

    const dots = new InstancedMesh(
      new SphereGeometry(0.05, 16, 12),
      standard(palette.cyan, { emissive: 0.8 }),
      GRID * GRID
    );
    dots.material.depthTest = false;
    dots.material.transparent = true;
    dots.renderOrder = 10;
    scene.add(dots);
    const matrix = new Matrix4();
    let clock = 0;

    return {
      update({ dt }) {
        if (params["move"] === true) {
          clock += dt;
        }
        const jitter = Number(params["jitter"]);
        for (let index = 0; index < features.length; index++) {
          const x = index % GRID;
          const y = Math.floor(index / GRID);
          const phase = hash2(x + 0.5, y + 9.5) * TAU;
          const wobble = 0.12 * jitter;
          const fx =
            0.5 +
            (hash2(x + 0.5, y + 0.5) - 0.5) * 0.8 * jitter +
            Math.sin(clock * 0.9 + phase) * wobble;
          const fy =
            0.5 +
            (hash2(x + 7.5, y + 3.5) - 0.5) * 0.8 * jitter +
            Math.cos(clock * 0.7 + phase) * wobble;
          features[index]?.set(fx, fy);
          matrix.makeTranslation(
            (x + fx) * CELL - SIZE / 2,
            0.02,
            (y + fy) * CELL - SIZE / 2
          );
          dots.setMatrixAt(index, matrix);
        }
        dots.instanceMatrix.needsUpdate = true;
        dots.visible = params["points"] === true;
        const mode = String(params["mode"]);
        uniforms.uMode.value =
          mode === "cells"
            ? modes.cells
            : mode === "stones"
              ? modes.stones
              : modes.cracks;
        context.readout("特徴点", `${GRID * GRID} 個`);
        context.readout("1 点で調べる候補", "周囲 3×3 = 9 個");
        context.caption(
          mode === "cells"
            ? "F1：最も近い特徴点までの距離。点の周りがくぼみ、細胞や泡のような模様になる。"
            : mode === "stones"
              ? "F2−F1：2 番目と 1 番目の距離の差。境界で 0 になるので、目地のある石畳を作れる。"
              : "同じ F2−F1 を溝の深さと発光に使うと、溶岩が透けるひび割れた地面になる。"
        );
      },
    };
  },
};
