import { Matrix4, ShaderMaterial, Vector2, Vector3 } from "three";
import { palette, rng } from "../../kit";
import {
  fullscreenPass,
  fullscreenVertex,
  renderNormals,
  screenTarget,
  showcaseScene,
} from "../../post";
import type { DemoModule } from "../../types";

const KERNEL = 24;

const views = { final: 0, ao: 1, off: 2 } as const;
type View = keyof typeof views;
const isView = (value: unknown): value is View =>
  typeof value === "string" && Object.hasOwn(views, value);

export const demo: DemoModule = {
  alt: "物の隅や、物が床に接する部分がほんのり暗くなる環境光の遮蔽を、描いた画面の深度と法線から近似する SSAO のデモ。各画素の周りの半球内に標本点をばらまき、その点が画面上の他の物の奥に隠れているかを深度で調べる。隠れた点が多いほど、周囲の光が届きにくいとみなして暗くする。",
  camera: { position: [0.8, 2.4, 6.5], target: [0, 1, -2] },
  controls: [
    {
      type: "select",
      key: "view",
      label: "表示",
      value: "final",
      options: [
        { value: "final", label: "SSAO あり" },
        { value: "ao", label: "遮蔽の量だけ" },
        { value: "off", label: "SSAO なし" },
      ],
    },
    {
      type: "range",
      key: "radius",
      label: "調べる半径",
      min: 0.1,
      max: 2,
      step: 0.05,
      value: 1.1,
      format: (value) => `${value.toFixed(2)} m`,
    },
    {
      type: "range",
      key: "intensity",
      label: "暗さ",
      min: 0,
      max: 4,
      step: 0.05,
      value: 2.4,
    },
    {
      type: "range",
      key: "samples",
      label: "標本点の数",
      min: 4,
      max: KERNEL,
      step: 1,
      value: 16,
    },
    { type: "toggle", key: "blur", label: "ざらつきをぼかす", value: true },
  ],
  legend: [{ color: palette.muted, label: "隅・接地部ほど暗い" }],
  setup(context) {
    const { scene, renderer, camera, params } = context;
    const showcase = showcaseScene(context);
    const colorTarget = screenTarget(context, { depth: true });
    const normalTarget = screenTarget(context, { float: false });
    const aoTarget = screenTarget(context, { scale: 0.5, float: false });
    const random = rng(5);
    // 半球内の標本点。中心付近に多く集める
    const kernel = Array.from({ length: KERNEL }, (_, index) => {
      const sample = new Vector3(
        random() * 2 - 1,
        random() * 2 - 1,
        random()
      ).normalize();
      const t = index / KERNEL;
      return sample
        .multiplyScalar(0.1 + 0.9 * t * t)
        .multiplyScalar(0.3 + random() * 0.7);
    });
    const aoUniforms = {
      uDepth: { value: colorTarget.depthTexture },
      uNormal: { value: normalTarget.texture },
      uKernel: { value: kernel },
      uProjection: { value: new Matrix4() },
      uProjectionInverse: { value: new Matrix4() },
      uRadius: { value: 1.1 },
      uSamples: { value: 16 },
    };
    const aoPass = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms: aoUniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uDepth;
          uniform sampler2D uNormal;
          uniform vec3 uKernel[${KERNEL}];
          uniform mat4 uProjection;
          uniform mat4 uProjectionInverse;
          uniform float uRadius;
          uniform float uSamples;
          varying vec2 vUv;
          vec3 viewPosition(vec2 uv) {
            float depth = texture2D(uDepth, uv).r;
            vec4 p = uProjectionInverse * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
            return p.xyz / p.w;
          }
          float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          void main() {
            float depth = texture2D(uDepth, vUv).r;
            if (depth >= 1.0) { gl_FragColor = vec4(1.0); return; }
            vec3 p = viewPosition(vUv);
            vec3 n = normalize(texture2D(uNormal, vUv).rgb * 2.0 - 1.0);
            // 画素ごとにランダムに回した接空間（標本の偏りを細かいノイズに変える）
            float angle = hash(gl_FragCoord.xy) * 6.2831853;
            vec3 randomVector = vec3(cos(angle), sin(angle), 0.0);
            vec3 t = normalize(randomVector - n * dot(randomVector, n));
            vec3 b = cross(n, t);
            mat3 tbn = mat3(t, b, n);
            float occlusion = 0.0;
            for (int i = 0; i < ${KERNEL}; i++) {
              if (float(i) >= uSamples) break;
              vec3 samplePosition = p + tbn * uKernel[i] * uRadius;
              vec4 clip = uProjection * vec4(samplePosition, 1.0);
              vec2 uv = clip.xy / clip.w * 0.5 + 0.5;
              float sceneZ = viewPosition(uv).z;
              // 標本点より手前に物があれば遮られている。離れすぎた物は数えない
              float range = smoothstep(0.0, 1.0, uRadius / abs(p.z - sceneZ));
              occlusion += (sceneZ >= samplePosition.z + 0.02 ? 1.0 : 0.0) * range;
            }
            float ao = 1.0 - occlusion / uSamples;
            gl_FragColor = vec4(vec3(ao), 1.0);
          }
        `,
      })
    );
    const compositeUniforms = {
      uColor: { value: colorTarget.texture },
      uAo: { value: aoTarget.texture },
      uTexel: { value: new Vector2() },
      uIntensity: { value: 2.4 },
      uView: { value: 0 },
      uBlur: { value: 1 },
    };
    const composite = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms: compositeUniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uColor;
          uniform sampler2D uAo;
          uniform vec2 uTexel;
          uniform float uIntensity;
          uniform float uView;
          uniform float uBlur;
          varying vec2 vUv;
          void main() {
            float ao = 0.0;
            if (uBlur > 0.5) {
              for (int y = -2; y <= 2; y++)
              for (int x = -2; x <= 2; x++) ao += texture2D(uAo, vUv + vec2(float(x), float(y)) * uTexel * 2.0).r;
              ao /= 25.0;
            } else {
              ao = texture2D(uAo, vUv).r;
            }
            ao = pow(clamp(ao, 0.0, 1.0), uIntensity);
            vec3 color = texture2D(uColor, vUv).rgb;
            if (uView < 0.5) color *= ao;
            else if (uView < 1.5) color = vec3(ao) * 0.9;
            gl_FragColor = vec4(color, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    const size = new Vector2();
    context.onResize(() => {
      renderer.getDrawingBufferSize(size);
      compositeUniforms.uTexel.value.set(1 / size.x, 1 / size.y);
    });
    context.setRender(() => {
      renderer.setRenderTarget(colorTarget);
      renderer.render(scene, camera);
      renderNormals(renderer, scene, camera, normalTarget);
      aoUniforms.uProjection.value.copy(camera.projectionMatrix);
      aoUniforms.uProjectionInverse.value.copy(camera.projectionMatrixInverse);
      aoPass.render(renderer, aoTarget);
      composite.render(renderer, null);
    });

    let time = 0;
    return {
      update({ dt }) {
        time += dt;
        showcase.update(time, 0.4);
        const view: View = isView(params["view"]) ? params["view"] : "final";
        compositeUniforms.uView.value = views[view];
        compositeUniforms.uIntensity.value = Number(params["intensity"]);
        compositeUniforms.uBlur.value = params["blur"] === true ? 1 : 0;
        aoUniforms.uRadius.value = Number(params["radius"]);
        aoUniforms.uSamples.value = Number(params["samples"]);
        context.readout("標本点", `${aoUniforms.uSamples.value} 個 / 画素`);
        context.caption(
          view === "ao"
            ? "遮蔽の量：白いほど周囲が開けていて、黒いほど周りを物に囲まれている。球が床に接する部分、柱の根元、像の輪の内側が暗い。"
            : view === "off"
              ? "SSAO なし：物が床から浮いて見え、隅や隙間の奥行きが分かりにくい。"
              : "各画素の周りの半球にばらまいた点のうち、画面上で他の物の奥に隠れた点の割合で暗くする。物の接地感と立体感が増す。"
        );
      },
    };
  },
};
