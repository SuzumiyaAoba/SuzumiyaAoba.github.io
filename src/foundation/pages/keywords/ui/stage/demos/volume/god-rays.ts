import {
  BoxGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  HalfFloatType,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from "three";
import { palette, rng, standard } from "../../kit";
import type { DemoModule } from "../../types";

const SUN_DISTANCE = 40;

export const demo: DemoModule = {
  alt: "廃墟の柱や木の隙間から差し込む光の筋（ゴッドレイ）を、画面上で描くデモ。まず太陽だけを白く、遮るものを黒く描いたマスクを作り、その画像を太陽の位置へ向かって何度もずらしながら重ねると、隙間から放射状に伸びる光の筋になる。",
  camera: { position: [0, 1.6, 8], target: [0, 2.6, -10] },
  studio: { background: "#2a1a24" },
  controls: [
    { type: "toggle", key: "rays", label: "光の筋", value: true },
    {
      type: "range",
      key: "exposure",
      label: "強さ",
      min: 0,
      max: 1.5,
      step: 0.01,
      value: 0.38,
    },
    {
      type: "range",
      key: "decay",
      label: "減衰（筋の長さ）",
      min: 0.9,
      max: 0.995,
      step: 0.001,
      value: 0.972,
    },
    {
      type: "range",
      key: "samples",
      label: "サンプル数",
      min: 8,
      max: 100,
      step: 1,
      value: 60,
    },
    { type: "toggle", key: "mask", label: "遮蔽マスクを表示", value: false },
    { type: "toggle", key: "move", label: "太陽を動かす", value: true },
  ],
  legend: [{ color: palette.amber, label: "太陽" }],
  setup(context) {
    const { scene, params, renderer, camera } = context;
    const random = rng(9);
    // 遮るもの：崩れた柱、アーチ、木
    const stone = standard("#5a4f52", { roughness: 0.9 });
    const bark = standard("#2c2320", { roughness: 1 });
    const leaves = standard("#26332a", { roughness: 1 });
    const occluders: Mesh[] = [];
    const add = (mesh: Mesh) => {
      mesh.castShadow = true;
      scene.add(mesh);
      occluders.push(mesh);
    };
    for (let index = 0; index < 7; index++) {
      const height = 2 + random() * 3;
      const pillar = new Mesh(
        new CylinderGeometry(0.3, 0.34, height, 16),
        stone
      );
      pillar.position.set(-6 + index * 2, height / 2, -6 - random() * 2);
      add(pillar);
    }
    const lintel = new Mesh(new BoxGeometry(4.6, 0.5, 0.7), stone);
    lintel.position.set(-3, 5.1, -6.8);
    add(lintel);
    for (let index = 0; index < 14; index++) {
      const side = index % 2 === 0 ? -1 : 1;
      const x = side * (4.5 + random() * 8);
      const z = -9 - random() * 8;
      const scale = 0.8 + random() * 1.2;
      const trunk = new Mesh(new CylinderGeometry(0.1, 0.16, 2.5, 8), bark);
      trunk.position.set(x, 1.25 * scale, z);
      trunk.scale.setScalar(scale);
      const crown = new Mesh(new ConeGeometry(1.1, 3.4, 10), leaves);
      crown.position.set(x, (2.5 + 1.4) * scale, z);
      crown.scale.setScalar(scale);
      add(trunk);
      add(crown);
    }

    // 太陽（空に置いた明るい円盤）
    const sunScene = new Scene();
    const sun = new Mesh(
      new CircleGeometry(3.2, 48),
      new MeshBasicMaterial({ color: new Color("#fff1d0") })
    );
    sunScene.add(sun);
    const sunVisible = sun.clone();
    sunVisible.material = new MeshBasicMaterial({
      color: new Color("#ffe0a8").multiplyScalar(3),
      fog: false,
    });
    scene.add(sunVisible);

    const sceneTarget = context.track(
      new WebGLRenderTarget(1, 1, { type: HalfFloatType })
    );
    const maskTarget = context.track(new WebGLRenderTarget(1, 1));
    const blackMaterial = context.track(
      new MeshBasicMaterial({ color: "#000000" })
    );
    const uniforms = {
      uScene: { value: sceneTarget.texture },
      uMask: { value: maskTarget.texture },
      uSun: { value: new Vector2(0.5, 0.5) },
      uExposure: { value: 0.38 },
      uDecay: { value: 0.972 },
      uSamples: { value: 60 },
      uRays: { value: 1 },
      uShowMask: { value: 0 },
    };
    const quadScene = new Scene();
    const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const composite = context.track(
      new ShaderMaterial({
        uniforms,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uScene;
          uniform sampler2D uMask;
          uniform vec2 uSun;
          uniform float uExposure;
          uniform float uDecay;
          uniform float uSamples;
          uniform float uRays;
          uniform float uShowMask;
          varying vec2 vUv;
          void main() {
            if (uShowMask > 0.5) {
              gl_FragColor = vec4(texture2D(uMask, vUv).rgb, 1.0);
              return;
            }
            vec3 color = texture2D(uScene, vUv).rgb;
            if (uRays > 0.5) {
              // 太陽の位置へ向かって少しずつ進みながらマスクを読み、減衰させながら足す
              vec2 delta = (vUv - uSun) / uSamples * 0.95;
              // 開始位置を画素ごとに少しずらし、サンプル間隔による縞を細かいノイズに変える
              float jitter = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
              vec2 coord = vUv - delta * jitter;
              float illumination = 1.0;
              vec3 rays = vec3(0.0);
              for (int i = 0; i < 100; i++) {
                if (float(i) >= uSamples) break;
                coord -= delta;
                rays += texture2D(uMask, coord).rgb * illumination;
                illumination *= uDecay;
              }
              color += rays / uSamples * uExposure * vec3(1.0, 0.78, 0.52) * 6.0;
            }
            gl_FragColor = vec4(color, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    const quad = new Mesh(new PlaneGeometry(2, 2), composite);
    context.track(quad.geometry);
    quadScene.add(quad);

    const size = new Vector2();
    context.onResize(() => {
      renderer.getDrawingBufferSize(size);
      sceneTarget.setSize(size.x, size.y);
      maskTarget.setSize(
        Math.max(1, Math.floor(size.x / 2)),
        Math.max(1, Math.floor(size.y / 2))
      );
    });
    const projected = new Vector3();
    const clearColor = new Color();
    context.setRender(() => {
      // 1. 通常の画面
      renderer.setRenderTarget(sceneTarget);
      renderer.render(scene, camera);
      // 2. 遮蔽マスク：太陽だけ白く、その手前の物体を黒く描く
      renderer.setRenderTarget(maskTarget);
      renderer.getClearColor(clearColor);
      const clearAlpha = renderer.getClearAlpha();
      renderer.setClearColor("#000000", 1);
      renderer.clear();
      const { autoClear } = renderer;
      renderer.autoClear = false;
      renderer.render(sunScene, camera);
      const { background } = scene;
      scene.background = null;
      scene.overrideMaterial = blackMaterial;
      const { visible } = sunVisible;
      sunVisible.visible = false;
      renderer.render(scene, camera);
      sunVisible.visible = visible;
      scene.overrideMaterial = null;
      scene.background = background;
      renderer.autoClear = autoClear;
      renderer.setClearColor(clearColor, clearAlpha);
      renderer.setRenderTarget(null);
      // 3. 合成
      projected.copy(sun.position).project(camera);
      uniforms.uSun.value.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5);
      renderer.render(quadScene, quadCamera);
    });

    let angle = 0;
    return {
      update({ dt }) {
        if (params["move"] === true) {
          angle += dt * 0.12;
        }
        const x = Math.sin(angle) * 10;
        sun.position.set(
          x * 0.6,
          4.2 + Math.cos(angle * 1.3) * 1.2,
          -SUN_DISTANCE
        );
        sun.lookAt(camera.position);
        sunVisible.position.copy(sun.position);
        sunVisible.quaternion.copy(sun.quaternion);
        uniforms.uExposure.value = Number(params["exposure"]);
        uniforms.uDecay.value = Number(params["decay"]);
        uniforms.uSamples.value = Number(params["samples"]);
        uniforms.uRays.value = params["rays"] === true ? 1 : 0;
        uniforms.uShowMask.value = params["mask"] === true ? 1 : 0;
        context.readout("サンプル数", `${uniforms.uSamples.value} 回 / 画素`);
        context.caption(
          params["mask"] === true
            ? "遮蔽マスク：太陽だけを白く、その手前にあるものを黒く描いた画像。この画像を太陽の方向へぼかすと光の筋になる。"
            : "太陽から画素へ向かう直線上のマスクを読み、途中に遮るものがあれば暗く、隙間なら明るくなる。これを全画素で行うと、隙間から放射状に伸びる光の筋が現れる。"
        );
      },
    };
  },
};
