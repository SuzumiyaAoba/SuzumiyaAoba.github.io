import { ShaderMaterial } from "three";
import { palette } from "../../kit";
import {
  fullscreenPass,
  fullscreenVertex,
  screenTarget,
  showcaseScene,
} from "../../post";
import type { DemoModule } from "../../types";

const modes = { lens: 0, glitch: 1 } as const;
type Mode = keyof typeof modes;
const isMode = (value: unknown): value is Mode =>
  typeof value === "string" && Object.hasOwn(modes, value);

export const demo: DemoModule = {
  alt: "レンズが色ごとに光を少しずつ違う位置に集めてしまう色収差を、画面上で再現するデモ。赤・緑・青を画面の中心から外側へ向かって少しずつずらして読むので、画面の端ほど物の輪郭に赤や青の縁が出る。被弾したときに一瞬だけ強くすると、衝撃の演出になる。",
  camera: { position: [0, 2.2, 7.5], target: [0, 1.8, -4] },
  studio: { background: "#07090f" },
  controls: [
    {
      type: "range",
      key: "strength",
      label: "ずれの大きさ",
      min: 0,
      max: 3,
      step: 0.05,
      value: 1,
    },
    {
      type: "select",
      key: "mode",
      label: "ずらし方",
      value: "lens",
      options: [
        { value: "lens", label: "レンズ（中心から放射状）" },
        { value: "glitch", label: "グリッチ（横方向の乱れ）" },
      ],
    },
    { type: "toggle", key: "zoom", label: "画面の隅を拡大", value: false },
    { type: "toggle", key: "vignette", label: "周辺減光も加える", value: true },
    { type: "button", key: "hit", label: "被弾（一瞬強くする）" },
  ],
  legend: [
    { color: palette.coral, label: "赤は外側へ" },
    { color: palette.sky, label: "青は内側へ" },
  ],
  setup(context) {
    const { scene, renderer, camera, params } = context;
    const showcase = showcaseScene(context);
    const sceneTarget = screenTarget(context);
    const uniforms = {
      uScene: { value: sceneTarget.texture },
      uStrength: { value: 1 },
      uMode: { value: 0 },
      uZoom: { value: 0 },
      uVignette: { value: 1 },
      uTime: { value: 0 },
      uAspect: { value: 1 },
    };
    const pass = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uScene;
          uniform float uStrength;
          uniform float uMode;
          uniform float uZoom;
          uniform float uVignette;
          uniform float uTime;
          uniform float uAspect;
          varying vec2 vUv;
          float hash(float n) { return fract(sin(n) * 43758.5453); }
          void main() {
            // 拡大表示：左上の隅を 3 倍に
            vec2 uv = uZoom > 0.5 ? vec2(0.02, 0.62) + vUv * 0.33 : vUv;
            vec2 offset;
            if (uMode < 0.5) {
              // 中心からの距離の 2 乗に比例して、外向きにずらす
              vec2 fromCenter = uv - 0.5;
              offset = fromCenter * dot(fromCenter * vec2(uAspect, 1.0), fromCenter * vec2(uAspect, 1.0)) * 0.014 * uStrength;
            } else {
              // グリッチ：横の帯ごとにランダムな量だけ横にずらす
              float band = floor(uv.y * 40.0);
              float jump = step(0.82, hash(band + floor(uTime * 12.0)));
              offset = vec2((hash(band * 3.1 + floor(uTime * 12.0)) - 0.5) * 0.02 * jump + 0.002, 0.0) * uStrength;
            }
            vec3 color;
            color.r = texture2D(uScene, uv + offset).r;
            color.g = texture2D(uScene, uv).g;
            color.b = texture2D(uScene, uv - offset).b;
            if (uVignette > 0.5) {
              vec2 v = (uv - 0.5) * vec2(uAspect, 1.0);
              color *= 1.0 - smoothstep(0.35, 1.1, length(v)) * 0.55;
            }
            gl_FragColor = vec4(color, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    context.onResize((width, height) => {
      uniforms.uAspect.value = width / height;
    });
    context.setRender(() => {
      renderer.setRenderTarget(sceneTarget);
      renderer.render(scene, camera);
      pass.render(renderer, null);
    });

    let time = 0;
    let impact = 0;
    return {
      action(key) {
        if (key === "hit") {
          impact = 1;
        }
      },
      update({ dt }) {
        time += dt;
        showcase.update(time);
        impact = Math.max(0, impact - dt * 2.5);
        const mode: Mode = isMode(params["mode"]) ? params["mode"] : "lens";
        uniforms.uMode.value = modes[mode];
        uniforms.uStrength.value = Number(params["strength"]) + impact * 6;
        uniforms.uZoom.value = params["zoom"] === true ? 1 : 0;
        uniforms.uVignette.value = params["vignette"] === true ? 1 : 0;
        uniforms.uTime.value = time;
        context.readout("現在のずれ", uniforms.uStrength.value.toFixed(2));
        context.caption(
          mode === "glitch"
            ? "横の帯ごとにランダムに色をずらすと、映像信号が乱れたようなグリッチになる。ハッキングやシステム異常の演出に使われる。"
            : "赤は外側へ、青は内側へ少しずらして読む。中心はずれず、画面の端ほど輪郭に色の縁が出る。レンズで撮ったような質感や、衝撃・めまいの演出になる。"
        );
      },
    };
  },
};
