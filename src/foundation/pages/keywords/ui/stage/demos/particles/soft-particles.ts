import {
  BoxGeometry,
  CylinderGeometry,
  DepthTexture,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  NormalBlending,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
} from "three";
import { palette, rng, standard, TAU } from "../../kit";
import { smokePuff } from "../../particles";
import type { DemoModule } from "../../types";

const PUFFS = 46;

export const demo: DemoModule = {
  alt: "柱と箱が立つ床の上を、地を這う霧が流れるデモ。霧は大きな板の集まりで、ソフトパーティクルをオフにすると板が床や柱に刺さった部分に硬い直線が現れる。オンにすると、背後の物体との深度差が小さいところほど板を薄くし、境界が柔らかく溶け込む。",
  camera: { position: [5.4, 2.2, 5.4], target: [0, 0.7, 0], autoRotate: 5 },
  controls: [
    { type: "toggle", key: "soft", label: "ソフトパーティクル", value: true },
    {
      type: "range",
      key: "distance",
      label: "フェードする深度差",
      min: 0.05,
      max: 2,
      step: 0.05,
      value: 0.8,
      format: (value) => `${value.toFixed(2)} m`,
    },
    {
      type: "toggle",
      key: "debug",
      label: "薄めている量を色で表示",
      value: false,
      hint: "赤いほど、背後の物体に近いため薄くしている部分です。",
    },
  ],
  legend: [{ color: palette.coral, label: "深度差で薄めた部分（表示時）" }],
  setup(context) {
    const { scene, params, renderer, camera } = context;
    const random = rng(8);
    const floor = new Mesh(
      new PlaneGeometry(14, 14),
      standard("#2a3240", { roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    for (let index = 0; index < 5; index++) {
      const angle = (index / 5) * TAU + 0.3;
      const pillar = new Mesh(
        new CylinderGeometry(0.28, 0.32, 2.4, 24),
        standard("#6e7788", { roughness: 0.6 })
      );
      pillar.position.set(Math.cos(angle) * 2.1, 1.2, Math.sin(angle) * 2.1);
      pillar.castShadow = true;
      scene.add(pillar);
    }
    const crate = new Mesh(
      new BoxGeometry(1, 0.8, 1),
      standard("#7a5b3c", { roughness: 0.8 })
    );
    crate.position.set(0.2, 0.4, 0.1);
    crate.rotation.y = 0.5;
    crate.castShadow = true;
    scene.add(crate);

    const target = new WebGLRenderTarget(1, 1);
    target.depthTexture = new DepthTexture(1, 1);
    context.track(target);

    const quad = new PlaneGeometry(1, 1);
    const geometry = new InstancedBufferGeometry();
    geometry.index = quad.index;
    geometry.setAttribute("position", quad.getAttribute("position"));
    geometry.setAttribute("uv", quad.getAttribute("uv"));
    const offsets = new Float32Array(PUFFS * 4);
    for (let index = 0; index < PUFFS; index++) {
      const angle = random() * TAU;
      const radius = Math.sqrt(random()) * 3.2;
      offsets.set(
        [
          Math.cos(angle) * radius,
          0.25 + random() * 0.5,
          Math.sin(angle) * radius,
          1.6 + random() * 1.6,
        ],
        index * 4
      );
    }
    geometry.setAttribute("iOffset", new InstancedBufferAttribute(offsets, 4));
    geometry.instanceCount = PUFFS;
    const uniforms = {
      uMap: { value: smokePuff() },
      uDepth: { value: target.depthTexture },
      uResolution: { value: new Vector2(1, 1) },
      uNear: { value: camera.near },
      uFar: { value: camera.far },
      uSoft: { value: 1 },
      uDistance: { value: 0.8 },
      uDebug: { value: 0 },
      uTime: { value: 0 },
    };
    const fog = new Mesh(
      geometry,
      new ShaderMaterial({
        uniforms,
        vertexShader: /* glsl */ `
          attribute vec4 iOffset;
          uniform float uTime;
          varying vec2 vUv;
          varying float vSeed;
          void main() {
            vUv = uv;
            vSeed = float(gl_InstanceID);
            vec3 center = iOffset.xyz;
            center.x += sin(uTime * 0.15 + vSeed) * 0.6;
            center.z += cos(uTime * 0.12 + vSeed * 1.3) * 0.6;
            vec4 mv = modelViewMatrix * vec4(center, 1.0);
            float angle = vSeed * 2.4 + uTime * 0.05;
            vec2 corner = vec2(cos(angle) * position.x - sin(angle) * position.y, sin(angle) * position.x + cos(angle) * position.y);
            mv.xy += corner * iOffset.w;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          #include <packing>
          uniform sampler2D uMap;
          uniform sampler2D uDepth;
          uniform vec2 uResolution;
          uniform float uNear;
          uniform float uFar;
          uniform float uSoft;
          uniform float uDistance;
          uniform float uDebug;
          varying vec2 vUv;
          void main() {
            vec4 texel = texture2D(uMap, vUv);
            float sceneZ = perspectiveDepthToViewZ(texture2D(uDepth, gl_FragCoord.xy / uResolution).x, uNear, uFar);
            float particleZ = perspectiveDepthToViewZ(gl_FragCoord.z, uNear, uFar);
            // ビュー空間の z は負。粒子が手前にあるほど particleZ − sceneZ が大きい
            float fade = uSoft > 0.5 ? clamp((particleZ - sceneZ) / uDistance, 0.0, 1.0) : 1.0;
            float alpha = texel.a * 0.42 * fade;
            vec3 color = vec3(0.78, 0.83, 0.9) * texel.rgb;
            if (uDebug > 0.5) {
              color = mix(vec3(0.96, 0.36, 0.33), vec3(0.78, 0.83, 0.9), fade);
              alpha = texel.a * 0.55;
            }
            gl_FragColor = vec4(color, alpha);
            #include <colorspace_fragment>
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: NormalBlending,
      })
    );
    fog.frustumCulled = false;
    scene.add(fog);

    const size = new Vector2();
    context.onResize(() => {
      renderer.getDrawingBufferSize(size);
      target.setSize(size.x, size.y);
      uniforms.uResolution.value.copy(size);
    });
    context.setRender(() => {
      // 1. 霧を除いたシーンを描き、深度をテクスチャに残す
      fog.visible = false;
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      // 2. 画面へ描き、霧は深度テクスチャと比べて薄める
      fog.visible = true;
      renderer.render(scene, camera);
    });

    return {
      update({ time }) {
        uniforms.uTime.value = time;
        uniforms.uSoft.value = params["soft"] === true ? 1 : 0;
        uniforms.uDistance.value = Number(params["distance"]);
        uniforms.uDebug.value = params["debug"] === true ? 1 : 0;
        context.readout("霧の板", `${PUFFS} 枚`);
        context.caption(
          params["soft"] === true
            ? "粒子の深度と、その画素に描かれている物体の深度の差が小さいほど透明にする。板が床や柱に刺さる線が消え、霧が地面に溶け込む。"
            : "板は平面なので、床や柱と交わるところで切り取られ、硬い直線の境界がくっきり見えてしまう。"
        );
      },
    };
  },
};
