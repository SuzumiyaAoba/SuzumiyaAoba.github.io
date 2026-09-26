import {
  BoxGeometry,
  InstancedMesh,
  Matrix4,
  ShaderMaterial,
  Vector2,
} from "three";
import type { WebGLRenderTarget } from "three";
import { palette, standard } from "../../kit";
import {
  fullscreenPass,
  fullscreenVertex,
  screenTarget,
  showcaseScene,
} from "../../post";
import type { DemoModule } from "../../types";

const modes = { off: 0, taa: 1, noclamp: 2 } as const;
type Mode = keyof typeof modes;
const isMode = (value: unknown): value is Mode =>
  typeof value === "string" && Object.hasOwn(modes, value);

/** ハルトン列（基数 b）の i 番目。画素以下のずらし量に使う。 */
function halton(index: number, base: number) {
  let result = 0;
  let fraction = 1 / base;
  let i = index;
  while (i > 0) {
    result += fraction * (i % base);
    i = Math.floor(i / base);
    fraction /= base;
  }
  return result;
}

export const demo: DemoModule = {
  alt: "細い柵や電線のギザギザとちらつきを、過去のフレームを使って消す時間方向アンチエイリアス（TAA）のデモ。毎フレーム、カメラの投影を 1 画素より小さくずらして描き、前のフレームまでの結果と少しずつ混ぜると、何枚ものずらした画像を平均したのと同じになり、輪郭がなめらかになる。動く物が残像になるのを防ぐため、過去の色を周囲の色の範囲に制限する。",
  camera: { position: [1.2, 1.7, 6.8], target: [0, 1.6, -4] },
  studio: { background: "#07090f" },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "アンチエイリアス",
      value: "taa",
      options: [
        { value: "off", label: "なし" },
        { value: "taa", label: "TAA" },
        { value: "noclamp", label: "TAA（色の制限なし）" },
      ],
    },
    {
      type: "range",
      key: "blend",
      label: "新しいフレームの割合",
      min: 0.02,
      max: 0.5,
      step: 0.01,
      value: 0.1,
      hint: "小さいほどなめらかになりますが、変化への追従が遅くなります。",
    },
    { type: "toggle", key: "move", label: "カメラを左右に動かす", value: true },
  ],
  legend: [{ color: palette.pink, label: "動くドローン（残像が出やすい）" }],
  setup(context) {
    const { scene, renderer, camera, params } = context;
    const showcase = showcaseScene(context);
    // エイリアシングが目立つ細い柵と電線
    const rods = new InstancedMesh(
      new BoxGeometry(0.02, 1.6, 0.02),
      standard("#c9ced8", { roughness: 0.4 }),
      40
    );
    const matrix = new Matrix4();
    for (let index = 0; index < 40; index++) {
      matrix.makeTranslation(-2.925 + index * 0.15, 0.8, -5.5);
      rods.setMatrixAt(index, matrix);
    }
    const rails = new InstancedMesh(
      new BoxGeometry(6, 0.02, 0.02),
      standard("#c9ced8", { roughness: 0.4 }),
      3
    );
    for (let index = 0; index < 3; index++) {
      matrix.makeTranslation(0, 0.3 + index * 0.6, -5.5);
      rails.setMatrixAt(index, matrix);
    }
    const wires = new InstancedMesh(
      new BoxGeometry(30, 0.012, 0.012),
      standard("#8a93a3", { roughness: 0.5 }),
      4
    );
    for (let index = 0; index < 4; index++) {
      const rotation = new Matrix4().makeRotationZ(0.04 + index * 0.02);
      matrix.makeTranslation(0, 3.4 + index * 0.25, -6).multiply(rotation);
      wires.setMatrixAt(index, matrix);
    }
    scene.add(rods, rails, wires);

    const colorTarget = screenTarget(context, { depth: true });
    const history: [WebGLRenderTarget, WebGLRenderTarget] = [
      screenTarget(context),
      screenTarget(context),
    ];
    const texel = new Vector2();
    const resolveUniforms = {
      uCurrent: { value: colorTarget.texture },
      uDepth: { value: colorTarget.depthTexture },
      uHistory: { value: history[0].texture },
      uTexel: { value: texel },
      uProjectionInverse: { value: new Matrix4() },
      uCameraWorld: { value: new Matrix4() },
      uPreviousViewProjection: { value: new Matrix4() },
      uBlend: { value: 0.1 },
      uClamp: { value: 1 },
      uReset: { value: 1 },
    };
    const resolve = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms: resolveUniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uCurrent;
          uniform sampler2D uDepth;
          uniform sampler2D uHistory;
          uniform vec2 uTexel;
          uniform mat4 uProjectionInverse;
          uniform mat4 uCameraWorld;
          uniform mat4 uPreviousViewProjection;
          uniform float uBlend;
          uniform float uClamp;
          uniform float uReset;
          varying vec2 vUv;
          void main() {
            vec3 current = texture2D(uCurrent, vUv).rgb;
            // 深度から位置を戻し、前のフレームではどこに映っていたかを求める（再投影）
            float depth = texture2D(uDepth, vUv).r;
            vec4 view = uProjectionInverse * vec4(vUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
            vec4 world = uCameraWorld * vec4(view.xyz / view.w, 1.0);
            vec4 previous = uPreviousViewProjection * world;
            vec2 previousUv = previous.xy / previous.w * 0.5 + 0.5;
            bool outside = any(lessThan(previousUv, vec2(0.0))) || any(greaterThan(previousUv, vec2(1.0)));
            if (uReset > 0.5 || outside) { gl_FragColor = vec4(current, 1.0); return; }
            vec3 past = texture2D(uHistory, previousUv).rgb;
            if (uClamp > 0.5) {
              // 周囲 3×3 の今の色の範囲に過去の色を収め、動く物の残像を防ぐ
              vec3 low = current;
              vec3 high = current;
              for (int y = -1; y <= 1; y++) {
                for (int x = -1; x <= 1; x++) {
                  vec3 c = texture2D(uCurrent, vUv + vec2(float(x), float(y)) * uTexel).rgb;
                  low = min(low, c);
                  high = max(high, c);
                }
              }
              past = clamp(past, low, high);
            }
            gl_FragColor = vec4(mix(past, current, uBlend), 1.0);
          }
        `,
      })
    );
    const displayUniforms = {
      uSource: { value: colorTarget.texture },
    };
    const display = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms: displayUniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uSource;
          varying vec2 vUv;
          void main() {
            gl_FragColor = vec4(texture2D(uSource, vUv).rgb, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    const size = new Vector2();
    context.onResize(() => {
      renderer.getDrawingBufferSize(size);
      texel.set(1 / size.x, 1 / size.y);
      resolveUniforms.uReset.value = 1;
    });

    let frame = 0;
    let read = 0;
    let mode: Mode = "taa";
    const viewProjection = new Matrix4();
    context.setRender(() => {
      const jitter = mode !== "off";
      camera.updateProjectionMatrix();
      if (jitter) {
        // 1 画素より小さいずらし（-0.5〜0.5 画素）を投影行列に足す
        frame += 1;
        const jx = halton((frame % 16) + 1, 2) - 0.5;
        const jy = halton((frame % 16) + 1, 3) - 0.5;
        camera.projectionMatrix.elements[8] =
          (camera.projectionMatrix.elements[8] ?? 0) + (jx * 2) / size.x;
        camera.projectionMatrix.elements[9] =
          (camera.projectionMatrix.elements[9] ?? 0) + (jy * 2) / size.y;
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      }
      renderer.setRenderTarget(colorTarget);
      renderer.render(scene, camera);
      if (!jitter) {
        displayUniforms.uSource.value = colorTarget.texture;
        display.render(renderer, null);
        resolveUniforms.uReset.value = 1;
        return;
      }
      const write = history[1 - read] ?? history[0];
      resolveUniforms.uHistory.value = (history[read] ?? history[0]).texture;
      resolveUniforms.uProjectionInverse.value.copy(
        camera.projectionMatrixInverse
      );
      resolveUniforms.uCameraWorld.value.copy(camera.matrixWorld);
      resolve.render(renderer, write);
      resolveUniforms.uReset.value = 0;
      displayUniforms.uSource.value = write.texture;
      display.render(renderer, null);
      read = 1 - read;
      camera.updateProjectionMatrix();
      viewProjection.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      resolveUniforms.uPreviousViewProjection.value.copy(viewProjection);
    });

    let time = 0;
    let sway = 0;
    return {
      update({ dt }) {
        time += dt;
        showcase.update(time, 1.2);
        const next: Mode = isMode(params["mode"]) ? params["mode"] : "taa";
        if (next !== mode) {
          mode = next;
          resolveUniforms.uReset.value = 1;
        }
        resolveUniforms.uBlend.value = Number(params["blend"]);
        resolveUniforms.uClamp.value = mode === "noclamp" ? 0 : 1;
        if (params["move"] === true) {
          sway += dt;
          camera.position.x = 1.2 + Math.sin(sway * 0.5) * 1.2;
          camera.lookAt(0, 1.6, -4);
        }
        context.caption(
          mode === "off"
            ? "アンチエイリアスなし：細い柵や電線は、画素の中心に当たるかどうかでギザギザに途切れ、カメラが動くとちらつく。"
            : mode === "noclamp"
              ? "過去の色を制限しないと、動くドローンや柵の後ろに残像（ゴースト）が尾を引く。"
              : "毎フレーム投影を 1 画素より小さくずらして描き、前のフレームまでの結果と混ぜる。細い線の途切れやちらつきが消え、動く物の残像も色の制限で抑えられる。"
        );
      },
    };
  },
};
