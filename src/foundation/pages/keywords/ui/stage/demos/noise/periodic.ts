import { Vector3 } from "three";
import { glslHash, glslPerlin } from "../../glsl";
import { palette, segments } from "../../kit";
import { heightSurface } from "../../surface";
import type { DemoModule } from "../../types";

const TILE = 3;
const TILES = 3;
const SIZE = TILE * TILES;

export const demo: DemoModule = {
  alt: "同じノイズのタイルを 3×3 に並べた床。周期ノイズでは継ぎ目が見えずに一枚の地面としてつながり、通常のノイズではタイルの境目に段差と模様の途切れが現れる。",
  camera: { position: [6.5, 7.5, 7.5], target: [0, 0, 0] },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "タイルの作り方",
      value: "periodic",
      options: [
        { value: "periodic", label: "周期ノイズ" },
        { value: "plain", label: "通常のノイズを切り出す" },
      ],
    },
    {
      type: "range",
      key: "period",
      label: "1 枚あたりの格子数（周期）",
      min: 2,
      max: 8,
      step: 1,
      value: 3,
      hint: "周期は整数でなければ端がつながりません。",
    },
    {
      type: "toggle",
      key: "borders",
      label: "タイルの境目を表示",
      value: true,
    },
    { type: "toggle", key: "scroll", label: "模様をスクロール", value: false },
  ],
  legend: [{ color: palette.amber, label: "タイルの境目" }],
  setup(context) {
    const { scene, params } = context;
    const uniforms = {
      uPeriodic: { value: 1 },
      uPeriod: { value: 3 },
      uOffset: { value: 0 },
    };
    const surface = heightSurface({
      width: SIZE,
      segments: 330,
      uniforms,
      functions: /* glsl */ `
        ${glslHash}
        ${glslPerlin}
        float tileNoise(vec2 p) {
          vec2 uv = fract(p / ${TILE.toFixed(1)} + vec2(uOffset, 0.0)) * uPeriod;
          float sum = 0.0;
          float amp = 0.55;
          float scale = 1.0;
          for (int i = 0; i < 3; i++) {
            float n = uPeriodic > 0.5
              ? perlin2p(uv * scale, vec2(uPeriod * scale))
              : perlin2(uv * scale + 11.3);
            sum += n * amp;
            scale *= 2.0;
            amp *= 0.5;
          }
          return sum;
        }
        float surfaceHeight(vec2 p) { return tileNoise(p) * 0.4; }
        vec3 surfaceColor(vec2 p, float h, vec3 n) {
          float v = clamp(tileNoise(p) * 1.2 + 0.5, 0.0, 1.0);
          vec3 moss = mix(vec3(0.16, 0.27, 0.20), vec3(0.45, 0.60, 0.33), v);
          vec3 color = mix(moss, vec3(0.78, 0.66, 0.44), smoothstep(0.7, 0.9, v));
          return color;
        }
      `,
    });
    scene.add(surface);

    const borderPoints: Vector3[] = [];
    for (let index = 0; index <= TILES; index++) {
      const offset = index * TILE - SIZE / 2;
      borderPoints.push(
        new Vector3(offset, 0.02, -SIZE / 2),
        new Vector3(offset, 0.02, SIZE / 2),
        new Vector3(-SIZE / 2, 0.02, offset),
        new Vector3(SIZE / 2, 0.02, offset)
      );
    }
    const borders = segments(borderPoints, palette.amber, {
      width: 1.5,
      dashed: true,
      dashSize: 0.18,
      gapSize: 0.12,
      opacity: 0.85,
    });
    borders.material.depthTest = false;
    borders.renderOrder = 10;
    scene.add(borders);
    let offset = 0;

    return {
      update({ dt }) {
        if (params["scroll"] === true) {
          offset = (offset + dt * 0.05) % 1;
        }
        const periodic = params["mode"] === "periodic";
        uniforms.uPeriodic.value = periodic ? 1 : 0;
        uniforms.uPeriod.value = Number(params["period"]);
        uniforms.uOffset.value = offset;
        borders.visible = params["borders"] === true;
        context.readout("タイル", `${TILES} × ${TILES} 枚（同じ模様）`);
        context.readout("格子の周期", `${Number(params["period"])} 格子`);
        context.caption(
          periodic
            ? "格子点の乱数を周期で折り返すと、右端の格子点が左端と同じ勾配を持つ。並べても継ぎ目が消える。"
            : "普通のノイズを切り出しただけでは、右端と左端の値が一致しない。並べると境目で段差が生まれる。"
        );
      },
    };
  },
};
