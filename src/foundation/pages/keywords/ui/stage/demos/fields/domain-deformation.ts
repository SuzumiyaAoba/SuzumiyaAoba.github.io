import {
  BoxGeometry,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
} from "three";
import { palette } from "../../kit";
import { glslSdf, raymarchWorld } from "../../raymarch";
import type { DemoModule } from "../../types";

const modes = { twist: 0, bend: 1, wobble: 2 } as const;
type Mode = keyof typeof modes;
const isMode = (value: unknown): value is Mode =>
  typeof value === "string" && Object.hasOwn(modes, value);

/** 元の形の大きさ（半分の長さ）。変形前の輪郭の表示にも使う。 */
const SHAPES = {
  twist: { size: [0.55, 1.5, 0.55], center: [0, 1.55, 0] },
  bend: { size: [1.8, 0.2, 0.45], center: [0, 1.6, 0] },
  wobble: { size: [0.7, 0.9, 0.7], center: [0, 0.95, 0] },
} as const;

export const demo: DemoModule = {
  alt: "形そのものではなく、形を評価する座標を変形させる座標変形のデモ。高さに応じて座標を回すとねじれた塔に、横位置に応じて回すと曲がった板に、時間で揺らすとぷるぷる震えるゼリーになる。表面の格子模様も変形後の座標で描いているので、空間ごと歪んでいることが分かる。",
  camera: { position: [3.6, 2.8, 5.6], target: [0, 1.4, 0] },
  studio: { floor: false },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "変形",
      value: "twist",
      options: [
        { value: "twist", label: "ねじり（Twist）" },
        { value: "bend", label: "曲げ（Bend）" },
        { value: "wobble", label: "揺れ（Wobble）" },
      ],
    },
    {
      type: "range",
      key: "amount",
      label: "変形の強さ",
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.55,
    },
    {
      type: "toggle",
      key: "safe",
      label: "歩幅を縮めて安全に進む",
      value: true,
      hint: "変形すると距離が引き伸ばされ、正しい距離より大きな値になります。オフにして強く変形すると、表面を踏み越えて穴やちぎれが出ます。",
    },
    { type: "toggle", key: "ghost", label: "変形前の輪郭を表示", value: true },
    {
      type: "toggle",
      key: "animate",
      label: "強さを自動で変える",
      value: true,
    },
  ],
  legend: [{ color: palette.muted, label: "変形前の輪郭" }],
  setup(context) {
    const { scene, params } = context;
    const uniforms = {
      uTime: { value: 0 },
      uMode: { value: 0 },
      uAmount: { value: 0.55 },
    };
    const world = raymarchWorld(context, {
      uniforms,
      steps: 220,
      shadowOffset: 0.02,
      functions: /* glsl */ `
        ${glslSdf}
        // 変形：評価する点 p を、元の形のローカル座標に写す
        vec3 deform(vec3 p) {
          if (uMode < 0.5) {
            vec3 q = p - vec3(0.0, ${SHAPES.twist.center[1].toFixed(2)}, 0.0);
            float angle = uAmount * 2.2 * q.y;
            q.xz = rot2(angle) * q.xz;
            return q;
          }
          if (uMode < 1.5) {
            vec3 q = p - vec3(0.0, ${SHAPES.bend.center[1].toFixed(2)}, 0.0);
            float k = uAmount * 0.9;
            float c = cos(k * q.x);
            float s = sin(k * q.x);
            q.xy = mat2(c, s, -s, c) * q.xy;
            return q;
          }
          vec3 q = p - vec3(0.0, ${SHAPES.wobble.center[1].toFixed(2)}, 0.0);
          float h = clamp((q.y + 0.9) / 1.8, 0.0, 1.0);
          q.x += sin(uTime * 5.0 + q.y * 2.5) * 0.28 * uAmount * h * h;
          q.z += cos(uTime * 4.3 + q.y * 2.0) * 0.2 * uAmount * h * h;
          q.y *= 1.0 + 0.12 * uAmount * sin(uTime * 7.0);
          return q;
        }
        float shape(vec3 q) {
          if (uMode < 0.5) {
            float body = sdRoundBox(q, vec3(${SHAPES.twist.size.join(", ")}), 0.05);
            // 階ごとの溝
            float groove = abs(fract(q.y * 2.5) - 0.5) / 2.5 - 0.02;
            return max(body, -max(groove, -(max(abs(q.x), abs(q.z)) - 0.5)));
          }
          if (uMode < 1.5) return sdRoundBox(q, vec3(${SHAPES.bend.size.join(", ")}), 0.05);
          return sdRoundBox(q, vec3(${SHAPES.wobble.size.join(", ")}), 0.25);
        }
        float map(vec3 p) { return shape(deform(p)); }
        vec4 surface(vec3 p, vec3 n) {
          vec3 q = deform(p);
          // 変形後の座標で描いた格子。空間の歪みがそのまま模様に表れる
          vec3 g = abs(fract(q * 4.0) - 0.5);
          float line = 1.0 - smoothstep(0.0, 0.06, min(min(g.x, g.y), g.z) - 0.02);
          vec3 base = uMode < 0.5 ? vec3(0.42, 0.62, 0.95) : uMode < 1.5 ? vec3(0.95, 0.66, 0.3) : vec3(0.4, 0.9, 0.6);
          return vec4(mix(base, vec3(0.95), line * 0.55), uMode > 1.5 ? 0.15 : 0.45);
        }
      `,
    });

    const ghostMaterial = new LineBasicMaterial({
      color: palette.muted,
      transparent: true,
      opacity: 0.6,
    });
    const ghosts = Object.fromEntries(
      Object.entries(SHAPES).map(([key, { size, center }]) => {
        const box = new LineSegments(
          new EdgesGeometry(
            new BoxGeometry(size[0] * 2, size[1] * 2, size[2] * 2)
          ),
          ghostMaterial
        );
        box.position.set(center[0], center[1], center[2]);
        scene.add(box);
        return [key, box];
      })
    );

    let time = 0;
    let wave = 0;
    return {
      update({ dt }) {
        time += dt;
        const mode: Mode = isMode(params["mode"]) ? params["mode"] : "twist";
        uniforms.uMode.value = modes[mode];
        let amount = Number(params["amount"]);
        if (params["animate"] === true) {
          wave += dt;
          amount *= 0.5 - 0.5 * Math.cos(wave * 0.8);
        }
        uniforms.uAmount.value = amount;
        uniforms.uTime.value = time;
        // 変形で距離がどれだけ引き伸ばされるかの目安（リプシッツ定数）で歩幅を割る
        const stretch =
          mode === "twist"
            ? Math.hypot(1, amount * 2.2 * 0.78)
            : mode === "bend"
              ? 1 + amount * 0.9 * 1.8
              : 1 + amount * 0.9;
        const scale = params["safe"] === true ? 1 / stretch : 1;
        const stepScale = world.uniforms["uStepScale"];
        if (stepScale) {
          stepScale.value = scale;
        }
        for (const [key, ghost] of Object.entries(ghosts)) {
          ghost.visible = params["ghost"] === true && key === mode;
        }
        context.readout("変形の強さ", amount.toFixed(2));
        context.readout("歩幅の倍率", scale.toFixed(2));
        context.caption(
          mode === "twist"
            ? "形はただの箱。評価する点を高さ y に比例した角度だけ回してから箱の距離を測るので、塔がねじれて見える。"
            : mode === "bend"
              ? "横位置 x に比例した角度で座標を回すと、まっすぐな板が弓なりに曲がる。"
              : "時間と高さで座標を揺らすと、ゼリーのように震える。形のデータは一切動かしていない。"
        );
      },
    };
  },
};
