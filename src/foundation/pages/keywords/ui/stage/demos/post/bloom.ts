import { ShaderMaterial, Vector2 } from "three";
import type { Texture, WebGLRenderTarget } from "three";
import { palette } from "../../kit";
import {
  fullscreenPass,
  fullscreenVertex,
  screenTarget,
  showcaseScene,
} from "../../post";
import type { DemoModule } from "../../types";

const LEVELS = 5;

const views = { final: 0, bright: 1, glow: 2, none: 3 } as const;
type View = keyof typeof views;
const isView = (value: unknown): value is View =>
  typeof value === "string" && Object.hasOwn(views, value);

export const demo: DemoModule = {
  alt: "ネオンが光る夜の広場で、明るい部分を周囲へにじませるブルームのデモ。描いた画面から一定より明るい部分だけを取り出し、段階的に縮小しながらぼかして、元の画面に足し戻す。1 を超える明るさ（HDR）を保ったまま計算するので、本当に強く光るものだけがにじむ。各段階の画像を切り替えて確かめられる。",
  camera: { position: [0, 2.2, 7.5], target: [0, 1.8, -4] },
  studio: { background: "#07090f" },
  controls: [
    {
      type: "select",
      key: "view",
      label: "表示",
      value: "final",
      options: [
        { value: "final", label: "完成画像" },
        { value: "bright", label: "1. 明るい部分" },
        { value: "glow", label: "2. ぼかした光" },
        { value: "none", label: "ブルームなし" },
      ],
    },
    {
      type: "range",
      key: "threshold",
      label: "しきい値",
      min: 0,
      max: 4,
      step: 0.05,
      value: 1.2,
      hint: "この明るさを超えた部分だけがにじみます（1 = 画面で表示できる白）。",
    },
    {
      type: "range",
      key: "intensity",
      label: "強さ",
      min: 0,
      max: 2,
      step: 0.05,
      value: 0.8,
    },
    {
      type: "range",
      key: "radius",
      label: "広がり",
      min: 0,
      max: 1,
      step: 0.05,
      value: 0.6,
    },
    {
      type: "toggle",
      key: "hdr",
      label: "HDR（1 を超える明るさ）で計算",
      value: true,
      hint: "オフにすると明るさを 1 で切り捨ててからにじませるので、白い物まで一様に光ってしまいます。",
    },
  ],
  legend: [{ color: palette.cyan, label: "光る看板・ネオン" }],
  setup(context) {
    const { scene, renderer, camera, params } = context;
    const showcase = showcaseScene(context);
    const sceneTarget = screenTarget(context);
    const brightTarget = screenTarget(context, { scale: 0.5 });
    const levels = Array.from({ length: LEVELS }, (_, index) => ({
      down: screenTarget(context, { scale: 0.5 / 2 ** index }),
      blur: screenTarget(context, { scale: 0.5 / 2 ** index }),
    }));

    const brightUniforms = {
      uScene: { value: sceneTarget.texture },
      uThreshold: { value: 1.2 },
      uHdr: { value: 1 },
    };
    const brightPass = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms: brightUniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uScene;
          uniform float uThreshold;
          uniform float uHdr;
          varying vec2 vUv;
          void main() {
            vec3 color = texture2D(uScene, vUv).rgb;
            if (uHdr < 0.5) color = min(color, vec3(1.0));
            float brightness = max(color.r, max(color.g, color.b));
            // しきい値付近をなめらかにつなぐ（ソフトニー）
            float knee = uThreshold * 0.5 + 1e-4;
            float soft = clamp(brightness - uThreshold + knee, 0.0, 2.0 * knee);
            soft = soft * soft / (4.0 * knee);
            float contribution = max(soft, brightness - uThreshold) / max(brightness, 1e-4);
            gl_FragColor = vec4(color * contribution, 1.0);
          }
        `,
      })
    );
    const copyUniforms = {
      uSource: { value: brightTarget.texture },
    };
    const downPass = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms: copyUniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uSource;
          varying vec2 vUv;
          void main() { gl_FragColor = texture2D(uSource, vUv); }
        `,
      })
    );
    const blurUniforms = {
      uSource: { value: brightTarget.texture },
      uDirection: { value: new Vector2(1, 0) },
      uTexel: { value: new Vector2() },
    };
    const blurPass = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms: blurUniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uSource;
          uniform vec2 uDirection;
          uniform vec2 uTexel;
          varying vec2 vUv;
          void main() {
            // 9 タップのガウスぼかし（縦横に分けて 2 回）
            float weights[5] = float[](0.227, 0.194, 0.122, 0.054, 0.016);
            vec3 sum = texture2D(uSource, vUv).rgb * weights[0];
            for (int i = 1; i < 5; i++) {
              vec2 offset = uDirection * uTexel * float(i) * 1.5;
              sum += texture2D(uSource, vUv + offset).rgb * weights[i];
              sum += texture2D(uSource, vUv - offset).rgb * weights[i];
            }
            gl_FragColor = vec4(sum, 1.0);
          }
        `,
      })
    );
    const compositeUniforms = {
      uScene: { value: sceneTarget.texture },
      uBright: { value: brightTarget.texture },
      ...Object.fromEntries(
        levels.map((level, index) => [
          `uLevel${index}`,
          { value: level.down.texture },
        ])
      ),
      uIntensity: { value: 0.8 },
      uRadius: { value: 0.6 },
      uView: { value: 0 },
      uHdr: { value: 1 },
    };
    const compositePass = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms: compositeUniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uScene;
          uniform sampler2D uBright;
          uniform sampler2D uLevel0;
          uniform sampler2D uLevel1;
          uniform sampler2D uLevel2;
          uniform sampler2D uLevel3;
          uniform sampler2D uLevel4;
          uniform float uIntensity;
          uniform float uRadius;
          uniform float uView;
          uniform float uHdr;
          varying vec2 vUv;
          float levelWeight(float level) {
            // 広がりが大きいほど、粗い（大きくぼけた）段の比重を上げる
            return mix(1.2 - level * 0.2, 0.8 + level * 0.2, uRadius);
          }
          void main() {
            vec3 scene = texture2D(uScene, vUv).rgb;
            if (uHdr < 0.5) scene = min(scene, vec3(1.0));
            vec3 glow = texture2D(uLevel0, vUv).rgb * levelWeight(0.0)
              + texture2D(uLevel1, vUv).rgb * levelWeight(1.0)
              + texture2D(uLevel2, vUv).rgb * levelWeight(2.0)
              + texture2D(uLevel3, vUv).rgb * levelWeight(3.0)
              + texture2D(uLevel4, vUv).rgb * levelWeight(4.0);
            glow *= 0.35;
            vec3 color = scene;
            if (uView < 0.5) color = scene + glow * uIntensity;
            else if (uView < 1.5) color = texture2D(uBright, vUv).rgb;
            else if (uView < 2.5) color = glow * uIntensity;
            gl_FragColor = vec4(color, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );

    const size = new Vector2();
    const blur = (
      source: Texture,
      level: { down: WebGLRenderTarget; blur: WebGLRenderTarget }
    ) => {
      copyUniforms.uSource.value = source;
      downPass.render(renderer, level.down);
      size.set(level.down.width, level.down.height);
      blurUniforms.uTexel.value.set(1 / size.x, 1 / size.y);
      blurUniforms.uSource.value = level.down.texture;
      blurUniforms.uDirection.value.set(1, 0);
      blurPass.render(renderer, level.blur);
      blurUniforms.uSource.value = level.blur.texture;
      blurUniforms.uDirection.value.set(0, 1);
      blurPass.render(renderer, level.down);
    };
    context.setRender(() => {
      renderer.setRenderTarget(sceneTarget);
      renderer.render(scene, camera);
      brightPass.render(renderer, brightTarget);
      let source: Texture = brightTarget.texture;
      for (const level of levels) {
        blur(source, level);
        source = level.down.texture;
      }
      compositePass.render(renderer, null);
    });

    let time = 0;
    return {
      update({ dt }) {
        time += dt;
        showcase.update(time);
        const view: View = isView(params["view"]) ? params["view"] : "final";
        compositeUniforms.uView.value = views[view];
        compositeUniforms.uIntensity.value = Number(params["intensity"]);
        compositeUniforms.uRadius.value = Number(params["radius"]);
        brightUniforms.uThreshold.value = Number(params["threshold"]);
        const hdr = params["hdr"] === true ? 1 : 0;
        brightUniforms.uHdr.value = hdr;
        compositeUniforms.uHdr.value = hdr;
        context.readout(
          "ぼかしの段数",
          `${LEVELS} 段（1/2 〜 1/${2 ** LEVELS}）`
        );
        context.caption(
          view === "bright"
            ? "1. しきい値より明るい部分だけを取り出した画像。ネオンや電球のように、画面で表示できる白（1）を超えて明るい部分が残る。"
            : view === "glow"
              ? "2. 取り出した画像を、1/2、1/4 … と縮小しながらぼかし、重ね合わせた光。小さい段ほど遠くまでにじむ。"
              : view === "none"
                ? "ブルームなし。光るはずの看板も、ただの明るい色の板にしか見えない。"
                : "ぼかした光を元の画面に足すと、明るいものの周りに光があふれ、本当に光っているように見える。"
        );
      },
    };
  },
};
