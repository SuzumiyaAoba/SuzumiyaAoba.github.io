import { glslGridLine, glslHash, glslPerlin } from "../../glsl";
import { heightSurface } from "../../surface";
import type { DemoModule } from "../../types";

const modes = { tile: 0, rotate: 1, bomb: 2 } as const;

export const demo: DemoModule = {
  alt: "花と小石が散らばる広い地面のデモ。同じタイルをそのまま繰り返すと、遠くから見て格子状の模様がはっきり分かる。テクスチャボミングでは、格子の各マスに置く模様の位置・回転・大きさ・種類を乱数で変え、隣のマスからはみ出す分も合成するので、繰り返しが見えなくなる。",
  camera: { position: [0, 7.5, 8], target: [0, 0, -1.5] },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "模様の置き方",
      value: "bomb",
      options: [
        { value: "tile", label: "同じタイルの繰り返し" },
        { value: "rotate", label: "回転だけランダム" },
        { value: "bomb", label: "テクスチャボミング" },
      ],
    },
    {
      type: "range",
      key: "density",
      label: "模様を置く確率",
      min: 0.1,
      max: 1,
      step: 0.05,
      value: 0.75,
    },
    {
      type: "toggle",
      key: "grid",
      label: "格子（1 マス）を表示",
      value: false,
    },
  ],
  setup(context) {
    const { scene, params } = context;
    const uniforms = {
      uMode: { value: 2 },
      uDensity: { value: 0.75 },
      uGrid: { value: 0 },
    };
    const ground = heightSurface({
      width: 22,
      depth: 16,
      segments: 1,
      uniforms,
      functions: /* glsl */ `
        ${glslHash}
        ${glslPerlin}
        ${glslGridLine}
        const float CELL = 0.9;
        float surfaceHeight(vec2 p) { return 0.0; }
        // 1 つの模様（花か小石）。local は模様の中心からの座標
        vec4 stamp(vec2 local, float kind) {
          float r = length(local);
          if (kind < 0.55) {
            float angle = atan(local.y, local.x);
            float petal = 0.22 * (0.55 + 0.45 * cos(angle * 5.0));
            float body = 1.0 - smoothstep(petal - 0.015, petal + 0.015, r);
            float center = 1.0 - smoothstep(0.045, 0.06, r);
            vec3 color = mix(kind < 0.3 ? vec3(0.95, 0.9, 0.98) : vec3(0.98, 0.55, 0.7), vec3(1.0, 0.85, 0.2), center);
            return vec4(color, max(body, center));
          }
          vec2 q = local / vec2(0.2, 0.13);
          float pebble = 1.0 - smoothstep(0.85, 1.0, length(q));
          vec3 color = mix(vec3(0.45, 0.43, 0.4), vec3(0.72, 0.7, 0.66), clamp(0.5 - q.y * 0.4, 0.0, 1.0));
          return vec4(color, pebble);
        }
        vec2 rotate(vec2 v, float a) {
          return vec2(cos(a) * v.x - sin(a) * v.y, sin(a) * v.x + cos(a) * v.y);
        }
        vec3 surfaceColor(vec2 p, float h, vec3 n) {
          vec2 q = p / CELL;
          vec3 grass = mix(vec3(0.2, 0.34, 0.14), vec3(0.32, 0.46, 0.2), perlinFbm(p * 0.25, 4, 2.0, 0.5) + 0.5);
          vec3 color = grass;
          if (uMode < 0.5) {
            // 同じタイル：どのマスにも同じ位置・同じ向きで 2 つの模様
            vec2 f = fract(q);
            vec4 a = stamp((f - vec2(0.3, 0.35)) * CELL, 0.4);
            vec4 b = stamp((f - vec2(0.72, 0.7)) * CELL, 0.8);
            color = mix(color, a.rgb, a.a);
            color = mix(color, b.rgb, b.a);
          } else {
            vec2 cell = floor(q);
            // 自分と周囲 8 マスの模様を重ねる（はみ出した模様も拾う）
            for (int y = -1; y <= 1; y++) {
              for (int x = -1; x <= 1; x++) {
                vec2 c = cell + vec2(float(x), float(y));
                float present = hash12(c + 91.0);
                if (present > uDensity) continue;
                vec2 center = uMode < 1.5 ? c + 0.5 : c + hash22(c);
                float angle = hash12(c + 7.0) * 6.2831853;
                float scale = uMode < 1.5 ? 1.0 : 0.7 + hash12(c + 3.0) * 0.7;
                float kind = uMode < 1.5 ? 0.4 : hash12(c + 13.0);
                vec2 local = rotate((q - center) * CELL, angle) / scale;
                vec4 s = stamp(local, kind);
                color = mix(color, s.rgb, s.a);
              }
            }
          }
          float line = max(gridLine(q.x, 0.3), gridLine(q.y, 0.3)) * uGrid;
          return mix(color, vec3(0.97, 0.71, 0.3), line * 0.8);
        }
      `,
    });
    scene.add(ground);

    return {
      update() {
        const mode = String(params["mode"]);
        uniforms.uMode.value =
          mode === "tile"
            ? modes.tile
            : mode === "rotate"
              ? modes.rotate
              : modes.bomb;
        uniforms.uDensity.value = Number(params["density"]);
        uniforms.uGrid.value = params["grid"] === true ? 1 : 0;
        context.readout("1 マス", "0.9 m 四方");
        context.caption(
          mode === "tile"
            ? "同じタイルを並べると、花の配置が一定間隔で繰り返され、遠くから見ると格子がすぐに分かってしまう。"
            : mode === "rotate"
              ? "向きだけ変えても、各マスの中央に 1 つずつという規則性は残り、整列して見える。"
              : "マスごとのハッシュで位置・回転・大きさ・種類・有無を決め、周囲のマスからはみ出した模様も合成する。模様の素材は同じでも、繰り返しが消える。"
        );
      },
    };
  },
};
