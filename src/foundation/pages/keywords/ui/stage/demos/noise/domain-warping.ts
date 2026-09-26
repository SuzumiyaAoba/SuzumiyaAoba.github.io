import { BoxGeometry, Mesh } from "three";
import { glslGridLine, glslHash, glslPerlin } from "../../glsl";
import { standard } from "../../kit";
import { heightSurface } from "../../surface";
import type { DemoModule } from "../../types";

const patterns = { marble: 0, lava: 1, grid: 2 } as const;

export const demo: DemoModule = {
  alt: "ノイズで参照座標そのものを歪めるドメインワーピングのデモ。歪ませる強さと回数を上げると、単純な縞模様や格子が大理石や溶岩のように複雑にうねる。",
  camera: { position: [0, 8.6, 7.8], target: [0, 0, 0.3] },
  bloom: { strength: 0.6, radius: 0.4, threshold: 0.85 },
  controls: [
    {
      type: "select",
      key: "pattern",
      label: "元の模様",
      value: "marble",
      options: [
        { value: "marble", label: "縞（大理石）" },
        { value: "lava", label: "fBm（溶岩）" },
        { value: "grid", label: "格子（座標の確認）" },
      ],
      hint: "格子を選ぶと、参照座標がどれだけ曲がったかが見えます。",
    },
    {
      type: "range",
      key: "strength",
      label: "歪ませる強さ",
      min: 0,
      max: 4,
      step: 0.05,
      value: 2.2,
    },
    {
      type: "select",
      key: "levels",
      label: "歪ませる回数",
      value: "2",
      options: [
        { value: "0", label: "0 回" },
        { value: "1", label: "1 回" },
        { value: "2", label: "2 回" },
      ],
    },
    {
      type: "range",
      key: "speed",
      label: "流れる速さ",
      min: 0,
      max: 1.5,
      step: 0.05,
      value: 0.4,
    },
  ],
  setup(context) {
    const { scene, params } = context;
    const uniforms = {
      uTime: { value: 0 },
      uStrength: { value: 2.2 },
      uLevels: { value: 2 },
      uPattern: { value: 0 },
    };
    const surface = heightSurface({
      width: 10,
      depth: 7,
      segments: 260,
      uniforms,
      roughness: 0.3,
      emissive: true,
      functions: /* glsl */ `
        ${glslHash}
        ${glslPerlin}
        ${glslGridLine}
        float f(vec2 p) { return perlinFbm(p, 5, 2.0, 0.5); }
        vec2 warp(vec2 p) {
          vec2 q = p;
          if (uLevels > 0.5) {
            vec2 a = vec2(f(p + vec2(0.0, 0.0) + uTime * 0.07), f(p + vec2(5.2, 1.3) - uTime * 0.05));
            q = p + uStrength * a;
          }
          if (uLevels > 1.5) {
            vec2 b = vec2(f(q + vec2(1.7, 9.2) + uTime * 0.15), f(q + vec2(8.3, 2.8) + uTime * 0.126));
            q = p + uStrength * b;
          }
          return q;
        }
        float patternValue(vec2 p) {
          vec2 q = warp(p * 0.42);
          if (uPattern < 0.5) return abs(sin(q.x * 3.0 + q.y * 1.2));
          if (uPattern < 1.5) return clamp(f(q) * 1.3 + 0.5, 0.0, 1.0);
          return 0.0;
        }
        float surfaceHeight(vec2 p) {
          if (uPattern > 1.5) return 0.0;
          if (uPattern < 0.5) return 0.0;
          return patternValue(p) * 0.18;
        }
        vec3 surfaceColor(vec2 p, float h, vec3 n) {
          if (uPattern > 1.5) {
            vec2 q = warp(p * 0.42) * 2.4;
            float checker = mod(floor(q.x) + floor(q.y), 2.0);
            vec3 base = mix(vec3(0.12, 0.16, 0.28), vec3(0.18, 0.26, 0.40), checker);
            float line = max(gridLine(q.x, 0.3), gridLine(q.y, 0.3));
            return mix(base, vec3(0.30, 0.85, 0.78), line);
          }
          float v = patternValue(p);
          if (uPattern < 0.5) {
            vec3 stone = mix(vec3(0.80, 0.80, 0.78), vec3(0.93, 0.92, 0.89), perlin2(p * 1.7) + 0.5);
            vec3 vein = vec3(0.20, 0.24, 0.32);
            float main = 1.0 - smoothstep(0.0, 0.1, v);
            float soft = (1.0 - smoothstep(0.0, 0.35, v)) * 0.35;
            return mix(stone, vein, max(main, soft));
          }
          return mix(vec3(0.10, 0.07, 0.07), vec3(0.35, 0.10, 0.04), smoothstep(0.45, 0.8, v));
        }
        vec3 surfaceEmission(vec2 p, float h) {
          if (uPattern < 0.5 || uPattern > 1.5) return vec3(0.0);
          float v = patternValue(p);
          vec3 glow = mix(vec3(1.0, 0.28, 0.05), vec3(1.25, 0.95, 0.45), smoothstep(0.75, 1.0, v));
          return glow * smoothstep(0.5, 0.85, v);
        }
      `,
    });
    surface.position.y = 0.3;
    const slab = new Mesh(new BoxGeometry(10, 0.3, 7), standard("#3a4150"));
    slab.position.y = 0.149;
    slab.castShadow = true;
    scene.add(surface, slab);
    let clock = 0;

    return {
      update({ dt }) {
        clock += dt * Number(params["speed"]);
        uniforms.uTime.value = clock;
        uniforms.uStrength.value = Number(params["strength"]);
        uniforms.uLevels.value = Number(params["levels"]);
        const pattern = String(params["pattern"]);
        uniforms.uPattern.value =
          pattern === "marble"
            ? patterns.marble
            : pattern === "lava"
              ? patterns.lava
              : patterns.grid;
        const levels = Number(params["levels"]);
        context.readout(
          "評価式",
          levels === 0
            ? "f(p)"
            : levels === 1
              ? "f(p + k·g(p))"
              : "f(p + k·g(p + k·h(p)))"
        );
        context.caption(
          levels === 0 || Number(params["strength"]) === 0
            ? "歪みなし：元の模様そのまま。縞はまっすぐ、格子は正方形のまま。"
            : "模様の値ではなく『どこを参照するか』をノイズでずらす。ずらす量もノイズなので、うねりの中にさらにうねりが生まれる。"
        );
      },
    };
  },
};
