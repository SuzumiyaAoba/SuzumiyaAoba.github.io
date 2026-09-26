import { DataTexture, LinearFilter, RGBAFormat, ShaderMaterial } from "three";
import type { Texture } from "three";
import { clamp, palette } from "../../kit";
import {
  fullscreenPass,
  fullscreenVertex,
  screenTarget,
  showcaseScene,
} from "../../post";
import type { DemoModule } from "../../types";

const LUT_SIZE = 32;

type Grade = (r: number, g: number, b: number) => [number, number, number];

const luminance = (r: number, g: number, b: number) =>
  0.2126 * r + 0.7152 * g + 0.0722 * b;
const saturate = (
  r: number,
  g: number,
  b: number,
  amount: number
): [number, number, number] => {
  const y = luminance(r, g, b);
  return [y + (r - y) * amount, y + (g - y) * amount, y + (b - y) * amount];
};
const contrast = (value: number, amount: number) =>
  (value - 0.5) * amount + 0.5;

const identity: Grade = (r, g, b) => [r, g, b];

/** 画調の例。入力も出力も画面の色（0〜1）。 */
const grades: Record<string, { label: string; grade: Grade }> = {
  neutral: { label: "変換なし", grade: identity },
  teal: {
    label: "ティール＆オレンジ（映画調）",
    grade: (r, g, b) => {
      const y = luminance(r, g, b);
      // 暗部を青緑へ、明部と肌色の範囲を橙へ寄せる
      const shadow = 1 - y;
      const [sr, sg, sb] = saturate(r, g, b, 1.15);
      return [
        contrast(sr + y * 0.08 - shadow * 0.06, 1.12),
        contrast(sg + shadow * 0.02, 1.1),
        contrast(sb + shadow * 0.1 - y * 0.08, 1.12),
      ];
    },
  },
  horror: {
    label: "ホラー（低彩度・緑）",
    grade: (r, g, b) => {
      const [sr, sg, sb] = saturate(r, g, b, 0.35);
      return [
        contrast(sr * 0.9, 1.25) - 0.03,
        contrast(sg * 1.02 + 0.02, 1.2),
        contrast(sb * 0.88, 1.25) - 0.02,
      ];
    },
  },
  dusk: {
    label: "夕暮れ（暖色）",
    grade: (r, g, b) => {
      const [sr, sg, sb] = saturate(r, g, b, 1.1);
      return [sr * 1.1 + 0.04, sg * 0.97 + 0.01, sb * 0.8];
    },
  },
  sepia: {
    label: "セピア（回想）",
    grade: (r, g, b) => {
      const y = luminance(r, g, b);
      return [y * 1.07 + 0.05, y * 0.9 + 0.03, y * 0.68 + 0.02];
    },
  },
  cyber: {
    label: "サイバー（マゼンタ / シアン）",
    grade: (r, g, b) => {
      const y = luminance(r, g, b);
      const [sr, sg, sb] = saturate(r, g, b, 1.35);
      return [
        contrast(sr + (1 - y) * 0.08, 1.15),
        contrast(sg * 0.9, 1.2),
        contrast(sb + y * 0.06 + 0.04, 1.1),
      ];
    },
  },
};

/** 3D の色変換表（LUT）を、青の値ごとに横に並べた 2D 画像として作る。 */
function buildLut(grade: Grade) {
  const width = LUT_SIZE * LUT_SIZE;
  const data = new Uint8Array(width * LUT_SIZE * 4);
  for (let b = 0; b < LUT_SIZE; b++) {
    for (let g = 0; g < LUT_SIZE; g++) {
      for (let r = 0; r < LUT_SIZE; r++) {
        const [or, og, ob] = grade(
          r / (LUT_SIZE - 1),
          g / (LUT_SIZE - 1),
          b / (LUT_SIZE - 1)
        );
        const index = (g * width + b * LUT_SIZE + r) * 4;
        data[index] = clamp(or) * 255;
        data[index + 1] = clamp(og) * 255;
        data[index + 2] = clamp(ob) * 255;
        data[index + 3] = 255;
      }
    }
  }
  const texture = new DataTexture(data, width, LUT_SIZE, RGBAFormat);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export const demo: DemoModule = {
  alt: "描いた画面の色を、あらかじめ作った色の対応表（LUT）で一括して変換するカラーグレーディングのデモ。同じ夜の広場が、映画調のティール＆オレンジ、ホラーの低彩度、夕暮れ、セピア、サイバー調へと、表を差し替えるだけで変わる。画面の左右で変換前と変換後を比べられる。",
  camera: { position: [0, 2.2, 7.5], target: [0, 1.8, -4] },
  studio: { background: "#07090f" },
  controls: [
    {
      type: "select",
      key: "grade",
      label: "画調",
      value: "teal",
      options: Object.entries(grades).map(([value, { label }]) => ({
        value,
        label,
      })),
    },
    {
      type: "range",
      key: "strength",
      label: "適用の強さ",
      min: 0,
      max: 1,
      step: 0.01,
      value: 1,
    },
    {
      type: "range",
      key: "split",
      label: "比較の境目（左 = 変換前）",
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.5,
    },
  ],
  legend: [{ color: palette.ink, label: "縦線の左が変換前、右が変換後" }],
  setup(context) {
    const { scene, renderer, camera, params } = context;
    const showcase = showcaseScene(context);
    const sceneTarget = screenTarget(context);
    const luts = new Map<string, DataTexture>();
    const lutFor = (key: string) => {
      let texture = luts.get(key);
      if (!texture) {
        texture = context.track(buildLut(grades[key]?.grade ?? identity));
        luts.set(key, texture);
      }
      return texture;
    };
    const uniforms = {
      uScene: { value: sceneTarget.texture },
      uLut: { value: lutFor("teal") as Texture },
      uStrength: { value: 1 },
      uSplit: { value: 0.5 },
    };
    const pass = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uScene;
          uniform sampler2D uLut;
          uniform float uStrength;
          uniform float uSplit;
          varying vec2 vUv;
          const float SIZE = ${LUT_SIZE.toFixed(1)};
          vec3 linearToSrgb(vec3 c) {
            return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
          }
          // 2D に並べた 3D LUT を読む：青の値で 2 枚の切れ目を選び、その間を補間する
          vec3 lookup(vec3 color) {
            float blue = color.b * (SIZE - 1.0);
            float slice0 = floor(blue);
            float slice1 = min(slice0 + 1.0, SIZE - 1.0);
            vec2 inner = (color.rg * (SIZE - 1.0) + 0.5) / vec2(SIZE * SIZE, SIZE);
            vec3 a = texture2D(uLut, inner + vec2(slice0 / SIZE, 0.0)).rgb;
            vec3 b = texture2D(uLut, inner + vec2(slice1 / SIZE, 0.0)).rgb;
            return mix(a, b, blue - slice0);
          }
          void main() {
            vec3 hdr = texture2D(uScene, vUv).rgb;
            vec3 display = clamp(linearToSrgb(toneMapping(hdr)), 0.0, 1.0);
            vec3 graded = mix(display, lookup(display), uStrength);
            vec3 color = vUv.x < uSplit ? display : graded;
            float line = 1.0 - smoothstep(0.0, 0.0015, abs(vUv.x - uSplit));
            gl_FragColor = vec4(mix(color, vec3(1.0), line * 0.85), 1.0);
          }
        `,
      })
    );
    context.setRender(() => {
      renderer.setRenderTarget(sceneTarget);
      renderer.render(scene, camera);
      pass.render(renderer, null);
    });

    // HUD：LUT の中身（青の値ごとの切れ目を横に並べたもの）
    const figure = document.createElement("figure");
    figure.className = "keyword-stage-graph";
    const caption = document.createElement("figcaption");
    caption.textContent = "LUT 画像（32×32×32 を横に並べたもの）";
    const canvas = document.createElement("canvas");
    canvas.width = LUT_SIZE * LUT_SIZE;
    canvas.height = LUT_SIZE;
    canvas.style.width = "14rem";
    canvas.style.display = "block";
    canvas.style.imageRendering = "pixelated";
    figure.append(caption, canvas);
    context.hud(figure);
    const paint = (texture: DataTexture) => {
      const context2d = canvas.getContext("2d");
      const source = texture.image.data;
      if (!context2d || !(source instanceof Uint8Array)) {
        return;
      }
      const image = context2d.createImageData(canvas.width, canvas.height);
      // 画像の上下を合わせる（テクスチャは下から、キャンバスは上から）
      for (let y = 0; y < LUT_SIZE; y++) {
        const row = source.subarray(
          (LUT_SIZE - 1 - y) * canvas.width * 4,
          (LUT_SIZE - y) * canvas.width * 4
        );
        image.data.set(row, y * canvas.width * 4);
      }
      context2d.putImageData(image, 0, 0);
    };
    let shown = "";
    let time = 0;

    return {
      update({ dt }) {
        time += dt;
        showcase.update(time);
        const key = String(params["grade"]);
        if (key !== shown) {
          shown = key;
          const texture = lutFor(key);
          uniforms.uLut.value = texture;
          paint(texture);
        }
        uniforms.uStrength.value = Number(params["strength"]);
        uniforms.uSplit.value = Number(params["split"]);
        context.readout("画調", grades[key]?.label ?? "");
        context.readout(
          "表の大きさ",
          `${LUT_SIZE}³ = ${(LUT_SIZE ** 3).toLocaleString()} 色`
        );
        context.caption(
          "変換前の色（R, G, B）を 3 次元の座標とみなし、その位置に書かれた変換後の色を読む。表の中身さえ差し替えれば、どんな複雑な色調整も 1 回の読み込みで適用できる。"
        );
      },
    };
  },
};
