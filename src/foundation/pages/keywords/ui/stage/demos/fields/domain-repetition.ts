import { glslHash } from "../../glsl";
import { palette } from "../../kit";
import { glslSdf, raymarchWorld } from "../../raymarch";
import type { DemoModule } from "../../types";

const modes = { colonnade: 0, city: 1, gear: 2 } as const;
type Mode = keyof typeof modes;
const isMode = (value: unknown): value is Mode =>
  typeof value === "string" && Object.hasOwn(modes, value);

export const demo: DemoModule = {
  alt: "1 つの形の距離関数だけで、無限に続く列柱・高さの違うビル街・歯車の歯を描く空間反復のデモ。評価する座標をセルの大きさで折り返すので、形を何個並べても計算量はほとんど変わらない。元になった 1 セルをオレンジで強調できる。",
  camera: { position: [7.5, 4.6, 10.5], target: [0, 1.4, 0] },
  studio: { floor: false },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "反復のしかた",
      value: "colonnade",
      options: [
        { value: "colonnade", label: "1 方向（列柱）" },
        { value: "city", label: "2 方向（ビル街）" },
        { value: "gear", label: "極座標（歯車）" },
      ],
    },
    {
      type: "range",
      key: "spacing",
      label: "間隔 / 歯の数",
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.5,
    },
    {
      type: "toggle",
      key: "variation",
      label: "セルごとに変化を付ける",
      value: true,
      hint: "セル番号のハッシュで高さや太さを変えます。",
    },
    {
      type: "toggle",
      key: "neighbors",
      label: "隣のセルも調べる（ビル街）",
      value: true,
      hint: "オフにすると、隣の高いビルを見落として光線が建物に突き刺さり、破片のような誤りが出ます。",
    },
    {
      type: "toggle",
      key: "highlight",
      label: "元の 1 セルを強調",
      value: true,
    },
  ],
  legend: [{ color: palette.amber, label: "元になった 1 セル（セル番号 0）" }],
  setup(context) {
    const { params } = context;
    const uniforms = {
      uTime: { value: 0 },
      uMode: { value: 0 },
      uSpacing: { value: 2 },
      uTeeth: { value: 12 },
      uVariation: { value: 1 },
      uHighlight: { value: 1 },
      uNeighbors: { value: 1 },
    };
    raymarchWorld(context, {
      uniforms,
      stepScale: 0.7,
      steps: 160,
      functions: /* glsl */ `
        ${glslSdf}
        ${glslHash}
        // cell には、評価した点が属するセルの番号を返す
        float scene(vec3 p, out vec2 cell) {
          cell = vec2(0.0);
          if (uMode < 0.5) {
            // x 方向に無限に並ぶ列柱。z は abs で左右 2 列にする
            float s = uSpacing;
            cell.x = round(p.x / s);
            vec3 q = vec3(p.x - s * cell.x, p.y, abs(p.z) - 1.3);
            float thick = 0.24 + uVariation * 0.08 * (hash12(vec2(cell.x, 1.0)) - 0.5);
            float shaft = sdCappedCylinder(q - vec3(0.0, 1.35, 0.0), 1.35, thick);
            shaft -= 0.02 * cos(atan(q.z, q.x) * 16.0);
            float capital = sdRoundBox(q - vec3(0.0, 2.78, 0.0), vec3(0.38, 0.08, 0.38), 0.02);
            float plinth = sdRoundBox(q - vec3(0.0, 0.08, 0.0), vec3(0.36, 0.08, 0.36), 0.02);
            float beam = sdBox(vec3(0.0, p.y - 3.0, abs(p.z) - 1.3), vec3(1.0, 0.14, 0.42));
            return min(min(shaft, capital), min(plinth, beam));
          }
          if (uMode < 1.5) {
            // xz の 2 方向に並ぶビル。高さはセル番号のハッシュで決める。
            // 高さがセルごとに違うと隣のビルのほうが近いことがあるので、周囲 3×3 セルも調べる
            float s = uSpacing;
            vec2 home = round(p.xz / s);
            float best = 1e5;
            for (int j = -1; j <= 1; j++) {
              for (int i = -1; i <= 1; i++) {
                if (uNeighbors < 0.5 && (i != 0 || j != 0)) continue;
                vec2 c = home + vec2(float(i), float(j));
                vec2 q = p.xz - s * c;
                float h = mix(1.2, 0.3 + 3.2 * pow(hash12(c + 7.0), 2.0), uVariation);
                float building = sdRoundBox(vec3(q.x, p.y - h * 0.5, q.y), vec3(s * 0.32, h * 0.5, s * 0.32), 0.03);
                if (building < best) {
                  best = building;
                  cell = c;
                }
              }
            }
            return best;
          }
          // 極座標反復：角度をセクターで折り返して歯を 1 本だけ定義する
          const float GEAR_SCALE = 1.7;
          vec3 g = (p - vec3(0.0, 2.65, 0.0)) / GEAR_SCALE;
          g.xy = rot2(uTime * 0.4) * g.xy;
          float sector = 6.2831853 / uTeeth;
          float angle = atan(g.y, g.x);
          cell.x = round(angle / sector);
          float a = angle - sector * cell.x;
          vec2 local = length(g.xy) * vec2(cos(a), sin(a));
          float tooth = sdRoundBox(vec3(local.x - 1.2, local.y, g.z), vec3(0.16, 0.1 + 0.02 * uVariation * sin(cell.x * 2.0), 0.18), 0.02);
          float ring = sdCappedCylinder(g.xzy, 0.16, 1.12);
          float rim = max(ring, -sdCappedCylinder(g.xzy, 0.5, 0.88));
          // スポークは 5 本の極座標反復
          float spokeSector = 6.2831853 / 5.0;
          float sa = mod(angle + spokeSector * 0.5, spokeSector) - spokeSector * 0.5;
          vec2 sl = length(g.xy) * vec2(cos(sa), sin(sa));
          float spoke = sdRoundBox(vec3(sl.x - 0.5, sl.y, g.z), vec3(0.42, 0.07, 0.1), 0.02);
          float hub = sdCappedCylinder(g.xzy, 0.2, 0.26);
          return min(min(tooth, rim), min(spoke, hub)) * GEAR_SCALE;
        }
        float map(vec3 p) { vec2 cell; return scene(p, cell); }
        vec4 surface(vec3 p, vec3 n) {
          vec2 cell;
          scene(p, cell);
          bool origin = uHighlight > 0.5 && all(equal(cell, vec2(0.0)));
          if (origin) return vec4(0.97, 0.66, 0.26, 0.4);
          if (uMode < 0.5) return vec4(0.8, 0.78, 0.72, 0.7);
          if (uMode < 1.5) {
            float windows = step(0.5, fract(p.y * 4.0)) * step(0.3, fract((p.x + p.z) * 3.0));
            vec3 wall = mix(vec3(0.3, 0.36, 0.46), vec3(0.5, 0.56, 0.66), hash12(cell));
            return vec4(mix(wall, wall * 0.55, windows * step(abs(n.y), 0.5)), 0.5);
          }
          return vec4(0.62, 0.66, 0.74, 0.3);
        }
      `,
    });

    let time = 0;
    return {
      update({ dt }) {
        time += dt;
        const mode: Mode = isMode(params["mode"])
          ? params["mode"]
          : "colonnade";
        uniforms.uMode.value = modes[mode];
        const spacing = Number(params["spacing"]);
        uniforms.uSpacing.value =
          mode === "colonnade" ? 1.2 + spacing * 2 : 1 + spacing * 1.6;
        uniforms.uTeeth.value = Math.round(6 + spacing * 24);
        uniforms.uVariation.value = params["variation"] === true ? 1 : 0;
        uniforms.uHighlight.value = params["highlight"] === true ? 1 : 0;
        uniforms.uNeighbors.value = params["neighbors"] === true ? 1 : 0;
        uniforms.uTime.value = time;
        context.readout(
          "反復の単位",
          mode === "gear"
            ? `${uniforms.uTeeth.value} 等分`
            : `${uniforms.uSpacing.value.toFixed(2)} m 間隔`
        );
        context.readout(
          "定義した形",
          mode === "gear"
            ? "歯 1 本 + スポーク 1 本"
            : mode === "city"
              ? "ビル 1 棟"
              : "柱 1 本"
        );
        context.caption(
          mode === "colonnade"
            ? "x を間隔 s で折り返す（x − s·round(x/s)）と、どの点も「元の 1 本」の近くの座標として評価される。柱を 1 本書くだけで、地平線まで無限に並ぶ。"
            : mode === "city"
              ? "x と z の両方を折り返せば格子状に並ぶ。セル番号をハッシュに通して高さを変えれば、同じ式から変化のあるビル街ができる。高さが違うと隣のビルのほうが近い場合があるので、周囲のセルも調べる。"
              : "角度をセクター幅で折り返すと、歯を 1 本定義するだけで円周に並ぶ。スポークも同じ方法で 5 本に増やしている。"
        );
      },
    };
  },
};
