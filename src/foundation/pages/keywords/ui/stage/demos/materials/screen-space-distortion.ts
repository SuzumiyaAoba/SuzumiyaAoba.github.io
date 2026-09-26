import {
  BoxGeometry,
  CylinderGeometry,
  HalfFloatType,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
} from "three";
import { glslSimplex } from "../../glsl";
import { rng, standard } from "../../kit";
import { particleSystem } from "../../particles";
import type { DemoModule } from "../../types";

const FIRE = new Vector3(-1.4, 0.3, 0.6);
const FLAMES = 90;

export const demo: DemoModule = {
  alt: "焚き火の上の空気が揺らめく陽炎と、床から広がる衝撃波のデモ。いったん画面を描いてから、その画像を参照する位置をノイズや波でずらして描き直すことで、熱気や屈折を画面上で近似している。",
  camera: { position: [0.6, 2, 6.8], target: [0, 1.4, 0] },
  controls: [
    { type: "toggle", key: "haze", label: "陽炎", value: true },
    {
      type: "range",
      key: "strength",
      label: "歪みの強さ",
      min: 0,
      max: 3,
      step: 0.05,
      value: 1.2,
    },
    { type: "toggle", key: "auto", label: "衝撃波を自動で出す", value: true },
    { type: "button", key: "shock", label: "衝撃波" },
    { type: "toggle", key: "debug", label: "ずらし量を色で表示", value: false },
  ],
  setup(context) {
    const { scene, params, renderer, camera } = context;
    const random = rng(3);
    // 歪みが見えやすい、細かい模様の壁と床
    const wall = new Mesh(
      new PlaneGeometry(10, 5),
      new ShaderMaterial({
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vec2 p = vUv * vec2(20.0, 10.0);
            p.x += mod(floor(p.y), 2.0) * 0.5;
            vec2 f = fract(p);
            float mortar = step(0.06, f.x) * step(0.1, f.y);
            float tone = fract(sin(dot(floor(p), vec2(12.9898, 78.233))) * 43758.5);
            vec3 brick = mix(vec3(0.28, 0.3, 0.38), vec3(0.4, 0.43, 0.52), tone);
            gl_FragColor = vec4(pow(mix(vec3(0.08), brick, mortar), vec3(2.2)), 1.0);
            #include <colorspace_fragment>
          }
        `,
      })
    );
    wall.position.set(0, 2.5, -1.5);
    scene.add(wall);
    for (let index = 0; index < 3; index++) {
      const log = new Mesh(
        new CylinderGeometry(0.08, 0.1, 0.9, 10),
        standard("#4a3527")
      );
      log.rotation.set(Math.PI / 2, (index / 3) * Math.PI, 0);
      log.position.set(FIRE.x, 0.1, FIRE.z);
      scene.add(log);
    }
    const crate = new Mesh(new BoxGeometry(0.8, 0.8, 0.8), standard("#7a5b3c"));
    crate.position.set(1.8, 0.4, 0);
    crate.castShadow = true;
    scene.add(crate);
    const glow = new PointLight("#ff8a3a", 5, 6, 1.4);
    glow.position.copy(FIRE).setY(0.6);
    scene.add(glow);
    const flames = particleSystem({ capacity: FLAMES });
    scene.add(flames);
    const flameAge = Float32Array.from({ length: FLAMES }, () => random());

    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType });
    context.track(target);
    const uniforms = {
      uScene: { value: target.texture },
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uStrength: { value: 1.2 },
      uHaze: { value: 1 },
      uFire: { value: new Vector2() },
      uFireSize: { value: new Vector2(0.1, 0.3) },
      uShockCenter: { value: new Vector2() },
      uShockRadius: { value: -1 },
      uShockWidth: { value: 0.05 },
      uDebug: { value: 0 },
    };
    const quadScene = new Scene();
    const quadCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new Mesh(
      new PlaneGeometry(2, 2),
      new ShaderMaterial({
        uniforms,
        depthTest: false,
        depthWrite: false,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
        fragmentShader: /* glsl */ `
          ${glslSimplex}
          uniform sampler2D uScene;
          uniform float uTime;
          uniform float uAspect;
          uniform float uStrength;
          uniform float uHaze;
          uniform vec2 uFire;
          uniform vec2 uFireSize;
          uniform vec2 uShockCenter;
          uniform float uShockRadius;
          uniform float uShockWidth;
          uniform float uDebug;
          varying vec2 vUv;
          void main() {
            vec2 offset = vec2(0.0);
            // 陽炎：炎の上の縦長の範囲で、上へ流れるノイズを使ってずらす
            vec2 rel = (vUv - uFire) / uFireSize;
            float mask = uHaze * smoothstep(1.0, 0.2, length(vec2(rel.x, (rel.y - 0.9) * 0.55))) * step(-0.2, rel.y);
            if (mask > 0.0) {
              vec3 q = vec3(vUv * vec2(uAspect, 1.0) * 14.0, uTime * 0.8);
              q.y -= uTime * 3.0;
              offset += vec2(snoise(q), snoise(q + 17.0)) * 0.006 * mask;
            }
            // 衝撃波：輪の近くだけ、中心から外向きに押し出す
            if (uShockRadius > 0.0) {
              vec2 d = (vUv - uShockCenter) * vec2(uAspect, 1.0);
              float dist = length(d);
              float ring = 1.0 - smoothstep(0.0, uShockWidth, abs(dist - uShockRadius));
              float fade = 1.0 - smoothstep(0.2, 0.9, uShockRadius);
              offset -= normalize(d + 1e-5) / vec2(uAspect, 1.0) * ring * fade * 0.04;
            }
            offset *= uStrength;
            if (uDebug > 0.5) {
              vec3 base = texture2D(uScene, vUv).rgb * 0.25;
              gl_FragColor = vec4(base + vec3(abs(offset.x), abs(offset.y), 0.0) * 60.0, 1.0);
            } else {
              gl_FragColor = texture2D(uScene, vUv + offset);
            }
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    quadScene.add(quad);

    const size = new Vector2();
    context.onResize((width, height) => {
      renderer.getDrawingBufferSize(size);
      target.setSize(size.x, size.y);
      uniforms.uAspect.value = width / height;
    });
    context.setRender(() => {
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(quadScene, quadCamera);
    });
    context.track(quad.geometry);
    context.track(quad.material);

    const projected = new Vector3();
    const toScreen = (point: Vector3, out: Vector2) => {
      projected.copy(point).project(camera);
      return out.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5);
    };
    const shockOrigin = new Vector3(0.6, 0.02, 0.8);
    let shockAge = -1;
    let autoTimer = 0;
    const edge = new Vector2();

    return {
      action(key) {
        if (key === "shock") {
          shockAge = 0;
        }
      },
      update({ dt, time }) {
        uniforms.uTime.value = time;
        uniforms.uStrength.value = Number(params["strength"]);
        uniforms.uHaze.value = params["haze"] === true ? 1 : 0;
        uniforms.uDebug.value = params["debug"] === true ? 1 : 0;
        toScreen(FIRE, uniforms.uFire.value);
        toScreen(FIRE.clone().add(new Vector3(0.5, 1.4, 0)), edge);
        uniforms.uFireSize.value.set(
          Math.abs(edge.x - uniforms.uFire.value.x) * 1.2,
          Math.abs(edge.y - uniforms.uFire.value.y)
        );
        if (params["auto"] === true) {
          autoTimer += dt;
          if (autoTimer > 3) {
            autoTimer = 0;
            shockAge = 0;
          }
        }
        if (shockAge >= 0) {
          shockAge += dt;
          toScreen(shockOrigin, uniforms.uShockCenter.value);
          uniforms.uShockRadius.value = shockAge * 0.55;
          if (shockAge > 1.8) {
            shockAge = -1;
            uniforms.uShockRadius.value = -1;
          }
        }
        for (let index = 0; index < FLAMES; index++) {
          const age = ((flameAge[index] ?? 0) + dt / 0.9) % 1;
          flameAge[index] = age;
          const angle = index * 2.39;
          flames.positions.set(
            [
              FIRE.x + Math.cos(angle) * 0.18 * (1 - age),
              0.2 + age * 0.9,
              FIRE.z + Math.sin(angle) * 0.18 * (1 - age),
            ],
            index * 3
          );
          flames.sizes[index] = 0.35 * (1 - age * 0.7);
          flames.colors.set(
            [1.2 * (1 - age) + 0.3, 0.45 * (1 - age), 0.08, (1 - age) * 0.7],
            index * 4
          );
        }
        flames.setCount(FLAMES);
        flames.commit();
        glow.intensity = 4.5 + Math.sin(time * 12) * 0.7;
        context.readout("描画", "シーン → テクスチャ → ずらして画面へ");
        context.caption(
          "一度描いた画面を、少しずらした位置から読み直す。背景の模様が揺らいで見えるので、空気の揺らぎや屈折を安く表現できる。"
        );
      },
    };
  },
};
