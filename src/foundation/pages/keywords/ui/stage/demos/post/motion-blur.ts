import { Color, Matrix4, ShaderMaterial } from "three";
import type { Object3D } from "three";
import { palette } from "../../kit";
import {
  fullscreenPass,
  fullscreenVertex,
  screenTarget,
  showcaseScene,
} from "../../post";
import type { DemoModule } from "../../types";

export const demo: DemoModule = {
  alt: "動いている物や、カメラを振ったときの画面の流れを、移動の向きに像を引き伸ばして表すモーションブラーのデモ。各画素が前のフレームから画面上でどれだけ動いたか（モーションベクトル）を別の画像に描き、その向きに沿って色を読んで平均する。高速で回るドローンの光の輪が流れ、カメラを回すと背景全体が流れる。",
  camera: { position: [0, 2.2, 7.5], target: [0, 1.6, -3], autoRotate: 40 },
  studio: { background: "#07090f" },
  controls: [
    {
      type: "range",
      key: "shutter",
      label: "シャッター（ぶれの長さ）",
      min: 0,
      max: 1.5,
      step: 0.05,
      value: 0.6,
      hint: "1 フレームの移動量に対して、どれだけの長さぶらすか。0.5 が映画でよく使われる 180° シャッターです。",
    },
    {
      type: "range",
      key: "speed",
      label: "ドローンの速さ",
      min: 0.2,
      max: 4,
      step: 0.1,
      value: 2.2,
    },
    { type: "toggle", key: "pan", label: "カメラを回す", value: false },
    {
      type: "toggle",
      key: "vectors",
      label: "モーションベクトルを表示",
      value: false,
    },
  ],
  legend: [{ color: palette.pink, label: "高速で回るドローン" }],
  setup(context) {
    const { scene, renderer, camera, params } = context;
    const showcase = showcaseScene(context);
    context.setAutoRotate(false);
    const colorTarget = screenTarget(context, { depth: true });
    const velocityTarget = screenTarget(context);

    // 物体ごとに前のフレームの行列を覚えておき、今の位置との差を画面上の速度として描く
    const previousModel = new WeakMap<Object3D, Matrix4>();
    const viewProjection = new Matrix4();
    camera.updateMatrixWorld();
    const previousViewProjection = new Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    const velocityUniforms = {
      uPrevModel: { value: new Matrix4() },
      uPrevViewProjection: { value: previousViewProjection },
    };
    const velocityMaterial = context.track(
      new ShaderMaterial({
        uniforms: velocityUniforms,
        vertexShader: /* glsl */ `
          uniform mat4 uPrevModel;
          uniform mat4 uPrevViewProjection;
          varying vec4 vCurrent;
          varying vec4 vPrevious;
          void main() {
            vCurrent = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
            vPrevious = uPrevViewProjection * uPrevModel * vec4(position, 1.0);
            gl_Position = vCurrent;
          }
        `,
        fragmentShader: /* glsl */ `
          varying vec4 vCurrent;
          varying vec4 vPrevious;
          void main() {
            vec2 velocity = (vCurrent.xy / vCurrent.w - vPrevious.xy / vPrevious.w) * 0.5;
            gl_FragColor = vec4(velocity, 0.0, 1.0);
          }
        `,
      })
    );
    const meshes: Object3D[] = [];
    scene.traverse((object) => {
      if (object.type === "Mesh") {
        meshes.push(object);
        object.onBeforeRender = (
          _renderer,
          _scene,
          _camera,
          _geometry,
          material
        ) => {
          if (material === velocityMaterial) {
            velocityUniforms.uPrevModel.value.copy(
              previousModel.get(object) ?? object.matrixWorld
            );
            velocityMaterial.uniformsNeedUpdate = true;
          }
        };
      }
    });

    const blurUniforms = {
      uColor: { value: colorTarget.texture },
      uVelocity: { value: velocityTarget.texture },
      uShutter: { value: 0.6 },
      uShowVectors: { value: 0 },
      uFrameScale: { value: 2 },
    };
    const blurPass = fullscreenPass(
      context,
      new ShaderMaterial({
        uniforms: blurUniforms,
        vertexShader: fullscreenVertex,
        fragmentShader: /* glsl */ `
          uniform sampler2D uColor;
          uniform sampler2D uVelocity;
          uniform float uShutter;
          uniform float uShowVectors;
          uniform float uFrameScale;
          varying vec2 vUv;
          void main() {
            // 実際の描画間隔によらず、30fps の 1 フレーム分の移動量に換算する
            vec2 velocity = texture2D(uVelocity, vUv).xy * uShutter * uFrameScale;
            if (uShowVectors > 0.5) {
              vec3 base = texture2D(uColor, vUv).rgb * 0.15;
              gl_FragColor = vec4(base + vec3(abs(velocity) * 40.0, length(velocity) * 20.0), 1.0);
              #include <colorspace_fragment>
              return;
            }
            // 動きの向きに沿って前後に色を読み、平均する
            const int SAMPLES = 16;
            float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
            vec3 sum = vec3(0.0);
            for (int i = 0; i < SAMPLES; i++) {
              float t = (float(i) + jitter) / float(SAMPLES) - 0.5;
              sum += texture2D(uColor, vUv + velocity * t).rgb;
            }
            gl_FragColor = vec4(sum / float(SAMPLES), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );

    const clearColor = new Color();
    context.setRender(() => {
      renderer.setRenderTarget(colorTarget);
      renderer.render(scene, camera);
      // モーションベクトル
      viewProjection.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      );
      const { background } = scene;
      renderer.getClearColor(clearColor);
      const clearAlpha = renderer.getClearAlpha();
      scene.background = null;
      scene.overrideMaterial = velocityMaterial;
      renderer.setRenderTarget(velocityTarget);
      renderer.setClearColor("#000000", 1);
      renderer.clear();
      // 空（背景）の画素はカメラの回転だけで動くが、ここでは簡単のため 0 とする
      renderer.render(scene, camera);
      scene.overrideMaterial = null;
      scene.background = background;
      renderer.setClearColor(clearColor, clearAlpha);
      blurPass.render(renderer, null);
      // 次のフレームのために今の行列を覚える
      previousViewProjection.copy(viewProjection);
      for (const mesh of meshes) {
        const stored = previousModel.get(mesh);
        if (stored) {
          stored.copy(mesh.matrixWorld);
        } else {
          previousModel.set(mesh, mesh.matrixWorld.clone());
        }
      }
    });

    let time = 0;
    return {
      update({ dt }) {
        time += dt;
        showcase.update(time, Number(params["speed"]));
        context.setAutoRotate(params["pan"] === true);
        blurUniforms.uShutter.value = Number(params["shutter"]);
        if (dt > 0) {
          blurUniforms.uFrameScale.value = 1 / 30 / Math.max(dt, 1 / 240);
        }
        blurUniforms.uShowVectors.value = params["vectors"] === true ? 1 : 0;
        context.caption(
          params["vectors"] === true
            ? "モーションベクトル：各画素が 1 フレームで画面上をどれだけ動いたか（赤 = 横、緑 = 縦の大きさ）。動いている物とカメラの回転で生じる。"
            : "モーションベクトルの向きに沿って、前後の色を読んで平均する。速く動く物ほど長く流れ、止まっている物はくっきりしたまま。"
        );
      },
    };
  },
};
