import {
  AdditiveBlending,
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
} from "three";
import { glslHash, glslPerlin } from "../../glsl";
import { palette, standard } from "../../kit";
import type { DemoModule } from "../../types";

const debugChunk = /* glsl */ `
  vec3 uvDebug(vec2 uv) {
    vec2 f = fract(uv);
    vec3 color = vec3(f.x, f.y, 0.25);
    vec2 grid = abs(fract(uv * 4.0 - 0.5) - 0.5) / fwidth(uv * 4.0);
    float line = 1.0 - min(min(grid.x, grid.y), 1.0);
    return mix(color, vec3(1.0), line * 0.6);
  }
`;

export const demo: DemoModule = {
  alt: "岩壁を流れ落ちる滝、ベルトコンベア、回転するエネルギーシールドのデモ。どれも形は一切動いておらず、テクスチャを参照する UV 座標を時間でずらすだけで流れを表現している。UV を色で表示すると、座標そのものが流れている様子が分かる。",
  camera: { position: [0.5, 3.2, 8.4], target: [0, 1.8, 0] },
  bloom: { strength: 0.6, radius: 0.4, threshold: 0.8 },
  controls: [
    {
      type: "range",
      key: "speed",
      label: "スクロールの速さ",
      min: 0,
      max: 2,
      step: 0.05,
      value: 0.6,
    },
    {
      type: "toggle",
      key: "layers",
      label: "速さの違う 2 層を重ねる",
      value: true,
      hint: "1 層だけだと模様が一枚のまま滑って見えます。",
    },
    { type: "toggle", key: "debug", label: "UV 座標を色で表示", value: false },
  ],
  legend: [
    { color: palette.sky, label: "滝（下へスクロール）" },
    { color: palette.cyan, label: "シールド（横へスクロール）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const uniforms = {
      uTime: { value: 0 },
      uLayers: { value: 1 },
      uDebug: { value: 0 },
    };
    const cliff = new Mesh(
      new BoxGeometry(3.2, 3.6, 1),
      standard("#3b3833", { roughness: 0.95 })
    );
    cliff.position.set(-1.6, 1.8, -0.8);
    cliff.castShadow = true;
    const pool = new Mesh(
      new PlaneGeometry(4, 2),
      standard("#1d4f6e", { roughness: 0.15, metalness: 0.2 })
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(-1.6, 0.03, 0.8);
    scene.add(cliff, pool);

    const waterfall = new Mesh(
      new PlaneGeometry(1.6, 3.6, 1, 24),
      new ShaderMaterial({
        uniforms,
        transparent: true,
        side: DoubleSide,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 p = position;
            p.z += (1.0 - uv.y) * (1.0 - uv.y) * 0.9; // 下へ行くほど手前に張り出す
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          ${glslHash}
          ${glslPerlin}
          ${debugChunk}
          uniform float uTime;
          uniform float uLayers;
          uniform float uDebug;
          varying vec2 vUv;
          float streaks(vec2 uv) {
            return perlinFbm(vec2(uv.x * 7.0, uv.y * 1.2), 4, 2.0, 0.5) * 0.5 + 0.5;
          }
          void main() {
            vec2 uv1 = vUv + vec2(0.0, uTime);
            vec2 uv2 = vUv * 1.7 + vec2(0.3, uTime * 1.6);
            if (uDebug > 0.5) {
              gl_FragColor = vec4(uvDebug(uv1), 1.0);
              #include <colorspace_fragment>
              return;
            }
            float a = streaks(uv1);
            float b = uLayers > 0.5 ? streaks(uv2) : a;
            float foam = smoothstep(0.55, 0.85, mix(a, b, 0.5));
            vec3 deep = vec3(0.08, 0.35, 0.55);
            vec3 light = vec3(0.55, 0.85, 1.0);
            vec3 color = mix(deep, light, mix(a, b, 0.5));
            color = mix(color, vec3(1.0), foam);
            float edge = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
            gl_FragColor = vec4(pow(color, vec3(2.2)), 0.9 * edge);
            #include <colorspace_fragment>
          }
        `,
      })
    );
    waterfall.position.set(-1.6, 1.8, -0.28);
    scene.add(waterfall);

    const beltMaterial = new ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        ${debugChunk}
        uniform float uTime;
        uniform float uDebug;
        varying vec2 vUv;
        void main() {
          vec2 uv = vec2(vUv.x * 6.0 - uTime * 1.5, vUv.y);
          if (uDebug > 0.5) {
            gl_FragColor = vec4(uvDebug(uv), 1.0);
            #include <colorspace_fragment>
            return;
          }
          float slat = step(0.12, fract(uv.x));
          float chevron = step(0.5, fract(uv.x * 2.0 + abs(vUv.y - 0.5)));
          vec3 color = mix(vec3(0.05), mix(vec3(0.16, 0.18, 0.22), vec3(0.95, 0.72, 0.3), chevron * 0.35), slat);
          gl_FragColor = vec4(pow(color, vec3(2.2)), 1.0);
          #include <colorspace_fragment>
        }
      `,
    });
    const belt = new Mesh(new PlaneGeometry(3, 0.9), beltMaterial);
    belt.rotation.x = -Math.PI / 2;
    belt.position.set(2.2, 0.42, 1.2);
    const beltBase = new Mesh(
      new BoxGeometry(3.2, 0.4, 1),
      standard("#2a303b", { metalness: 0.5, roughness: 0.5 })
    );
    beltBase.position.set(2.2, 0.2, 1.2);
    beltBase.castShadow = true;
    scene.add(beltBase, belt);

    const shield = new Mesh(
      new CylinderGeometry(0.9, 0.9, 2.4, 64, 1, true),
      new ShaderMaterial({
        uniforms,
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          ${glslHash}
          ${glslPerlin}
          ${debugChunk}
          uniform float uTime;
          uniform float uLayers;
          uniform float uDebug;
          varying vec2 vUv;
          void main() {
            vec2 uv1 = vec2(vUv.x * 3.0 + uTime * 0.5, vUv.y * 2.0);
            vec2 uv2 = vec2(vUv.x * 5.0 - uTime * 0.8, vUv.y * 3.0 + uTime * 0.3);
            if (uDebug > 0.5) {
              gl_FragColor = vec4(uvDebug(uv1) * 0.7, 1.0);
              #include <colorspace_fragment>
              return;
            }
            float hex = abs(sin(uv1.x * 12.566) * sin(uv1.y * 12.566));
            float n = perlin2(uv2 * 2.0) * 0.5 + 0.5;
            float glow = smoothstep(0.85, 1.0, hex) * 0.8 + (uLayers > 0.5 ? n * n * 0.6 : 0.2);
            float fade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
            vec3 color = vec3(0.2, 0.9, 0.85) * glow * fade;
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      })
    );
    shield.position.set(2.2, 1.9, -0.8);
    const core = new Mesh(
      new CylinderGeometry(0.25, 0.3, 0.6, 24),
      standard(palette.cyan, { emissive: 0.6 })
    );
    core.position.set(2.2, 0.3, -0.8);
    scene.add(shield, core);
    const offset = new Vector2();

    return {
      update({ dt }) {
        const speed = Number(params["speed"]);
        uniforms.uTime.value += dt * speed;
        uniforms.uLayers.value = params["layers"] === true ? 1 : 0;
        uniforms.uDebug.value = params["debug"] === true ? 1 : 0;
        offset.set(0, uniforms.uTime.value % 1);
        context.readout("UV のずらし量（滝）", `v + ${offset.y.toFixed(2)}`);
        context.readout("動いている頂点", "0 個");
        context.caption(
          params["debug"] === true
            ? "赤＝u、緑＝v の小数部分。形は止まったまま、参照する座標だけが流れている。"
            : "頂点は 1 つも動かさず、テクスチャを読む座標 (u, v) に時間 × 速度を足すだけで、水やベルトが流れて見える。"
        );
      },
    };
  },
};
