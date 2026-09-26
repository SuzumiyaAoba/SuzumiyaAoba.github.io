import { Matrix4, MeshStandardMaterial, ShaderMaterial } from "three";
import { palette } from "../../kit";
import {
  fullscreenPass,
  fullscreenVertex,
  renderNormals,
  screenTarget,
  showcaseScene,
} from "../../post";
import type { DemoModule } from "../../types";

const views = { final: 0, reflection: 1, off: 2 } as const;
type View = keyof typeof views;
const isView = (value: unknown): value is View =>
  typeof value === "string" && Object.hasOwn(views, value);

export const demo: DemoModule = {
  alt: "濡れた床にネオンや柱が映り込む様子を、描き終えた画面の情報だけで近似する画面空間反射（SSR）のデモ。床の各画素から反射方向へ光線を少しずつ進め、深度バッファと比べて画面上のどこに当たるかを探し、その画素の色を映す。画面に映っていない物は映せないので、画面の端では反射が途切れる。",
  camera: { position: [0, 1.6, 7.5], target: [0, 1.2, -4] },
  studio: { background: "#07090f" },
  controls: [
    {
      type: "select",
      key: "view",
      label: "表示",
      value: "final",
      options: [
        { value: "final", label: "SSR あり" },
        { value: "reflection", label: "反射だけ" },
        { value: "off", label: "SSR なし" },
      ],
    },
    {
      type: "range",
      key: "steps",
      label: "光線の歩数",
      min: 8,
      max: 96,
      step: 1,
      value: 48,
    },
    {
      type: "range",
      key: "strength",
      label: "映り込みの強さ",
      min: 0,
      max: 1,
      step: 0.01,
      value: 0.7,
    },
    {
      type: "toggle",
      key: "fade",
      label: "画面の端でなめらかに消す",
      value: true,
      hint: "オフにすると、画面外に出た光線の反射がぷっつり切れるのがよく分かります。",
    },
  ],
  legend: [{ color: palette.pink, label: "床に映るネオン" }],
  setup(context) {
    const { scene, renderer, camera, params } = context;
    const showcase = showcaseScene(context);
    const floorMaterial = showcase.floor.material;
    if (floorMaterial instanceof MeshStandardMaterial) {
      floorMaterial.roughness = 0.2;
      floorMaterial.color.set("#15171c");
    }
    const colorTarget = screenTarget(context, { depth: true });
    const normalTarget = screenTarget(context, { float: false });
    const uniforms = {
      uColor: { value: colorTarget.texture },
      uDepth: { value: colorTarget.depthTexture },
      uNormal: { value: normalTarget.texture },
      uProjection: { value: new Matrix4() },
      uProjectionInverse: { value: new Matrix4() },
      uViewToWorld: { value: new Matrix4() },
      uSteps: { value: 48 },
      uStrength: { value: 0.7 },
      uView: { value: 0 },
      uFade: { value: 1 },
    };
    const pass = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uColor;
          uniform sampler2D uDepth;
          uniform sampler2D uNormal;
          uniform mat4 uProjection;
          uniform mat4 uProjectionInverse;
          uniform mat4 uViewToWorld;
          uniform float uSteps;
          uniform float uStrength;
          uniform float uView;
          uniform float uFade;
          varying vec2 vUv;
          vec3 viewPosition(vec2 uv) {
            float depth = texture2D(uDepth, uv).r;
            vec4 p = uProjectionInverse * vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
            return p.xyz / p.w;
          }
          vec2 project(vec3 p) {
            vec4 clip = uProjection * vec4(p, 1.0);
            return clip.xy / clip.w * 0.5 + 0.5;
          }
          float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          void main() {
            vec3 scene = texture2D(uColor, vUv).rgb;
            vec3 reflection = vec3(0.0);
            float weight = 0.0;
            float depth = texture2D(uDepth, vUv).r;
            vec3 n = normalize(texture2D(uNormal, vUv).rgb * 2.0 - 1.0);
            vec3 worldNormal = normalize((uViewToWorld * vec4(n, 0.0)).xyz);
            // 上を向いた面（床）だけ反射させる
            if (depth < 1.0 && worldNormal.y > 0.9) {
              vec3 p = viewPosition(vUv);
              vec3 v = normalize(p);
              vec3 r = normalize(reflect(v, n));
              float stepSize = 0.25;
              vec3 ray = p + r * stepSize * hash(gl_FragCoord.xy);
              for (int i = 0; i < 96; i++) {
                if (float(i) >= uSteps) break;
                ray += r * stepSize;
                stepSize *= 1.04;
                vec2 uv = project(ray);
                if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) break;
                float sceneZ = viewPosition(uv).z;
                float gap = sceneZ - ray.z;
                // 光線が画面上の物の奥に入った：当たり（厚みの範囲内だけ）
                if (gap > 0.0 && gap < 0.6) {
                  // 二分探索で当たりの位置を詰める
                  vec3 back = ray - r * stepSize;
                  for (int j = 0; j < 6; j++) {
                    vec3 middle = (back + ray) * 0.5;
                    if (viewPosition(project(middle)).z - middle.z > 0.0) ray = middle; else back = middle;
                  }
                  uv = project(ray);
                  vec2 edge = min(uv, 1.0 - uv);
                  float screenFade = uFade > 0.5 ? smoothstep(0.0, 0.12, min(edge.x, edge.y)) : 1.0;
                  float distanceFade = 1.0 - smoothstep(4.0, 16.0, length(ray - p));
                  float fresnel = 0.25 + 0.75 * pow(1.0 - max(dot(-v, n), 0.0), 3.0);
                  reflection = texture2D(uColor, uv).rgb;
                  weight = screenFade * distanceFade * fresnel * uStrength;
                  break;
                }
              }
            }
            vec3 color = scene;
            if (uView < 0.5) color = scene + reflection * weight;
            else if (uView < 1.5) color = reflection * weight;
            gl_FragColor = vec4(color, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    context.setRender(() => {
      renderer.setRenderTarget(colorTarget);
      renderer.render(scene, camera);
      renderNormals(renderer, scene, camera, normalTarget);
      uniforms.uProjection.value.copy(camera.projectionMatrix);
      uniforms.uProjectionInverse.value.copy(camera.projectionMatrixInverse);
      uniforms.uViewToWorld.value.copy(camera.matrixWorld);
      pass.render(renderer, null);
    });

    let time = 0;
    return {
      update({ dt }) {
        time += dt;
        showcase.update(time, 0.6);
        const view: View = isView(params["view"]) ? params["view"] : "final";
        uniforms.uView.value = views[view];
        uniforms.uSteps.value = Number(params["steps"]);
        uniforms.uStrength.value = Number(params["strength"]);
        uniforms.uFade.value = params["fade"] === true ? 1 : 0;
        context.caption(
          view === "reflection"
            ? "反射だけ：床から反射方向へ進めた光線が、画面上のどの画素に当たったかを示す。画面の外や物の裏側は映らない。"
            : view === "off"
              ? "SSR なし：濡れた床にネオンが映らず、空間の奥行きや光の雰囲気が弱い。"
              : "床の画素から反射方向へ光線を進め、深度バッファで物に当たる位置を探して、その画素の色を映す。すでに描いた画面を再利用するので安い。"
        );
      },
    };
  },
};
