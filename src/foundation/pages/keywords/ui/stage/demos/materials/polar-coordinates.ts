import {
  AdditiveBlending,
  Mesh,
  OctahedronGeometry,
  PlaneGeometry,
  ShaderMaterial,
} from "three";
import { glslHash } from "../../glsl";
import { palette, standard } from "../../kit";
import type { DemoModule } from "../../types";

const modes = { circle: 0, vortex: 1, cartesian: 2 } as const;

export const demo: DemoModule = {
  alt: "床に浮かぶ魔法陣と、渦を巻くポータルのデモ。位置を中心からの距離と角度に変換し、距離で同心円、角度で放射状の模様や回転を作る。同じ式を直交座標のまま使うと、円ではなく縞模様にしかならない。",
  camera: { position: [0, 5.2, 5.6], target: [0, 0.3, 0] },
  bloom: { strength: 0.9, radius: 0.5, threshold: 0.4 },
  studio: { background: "#06080f" },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "模様",
      value: "circle",
      options: [
        { value: "circle", label: "魔法陣" },
        { value: "vortex", label: "渦（ポータル）" },
        { value: "cartesian", label: "直交座標で同じ式" },
      ],
    },
    {
      type: "range",
      key: "speed",
      label: "回転の速さ",
      min: -2,
      max: 2,
      step: 0.05,
      value: 0.4,
    },
    {
      type: "range",
      key: "twist",
      label: "ねじれ（角度に距離を足す量）",
      min: 0,
      max: 12,
      step: 0.1,
      value: 5,
      hint: "渦モードで、角度 θ に r × ねじれ を足します。",
    },
    {
      type: "toggle",
      key: "debug",
      label: "距離 r と角度 θ を色で表示",
      value: false,
    },
  ],
  legend: [
    { color: palette.coral, label: "距離 r（表示時）" },
    { color: palette.lime, label: "角度 θ（表示時）" },
  ],
  setup(context) {
    const { scene, params } = context;
    const uniforms = {
      uTime: { value: 0 },
      uMode: { value: 0 },
      uTwist: { value: 5 },
      uDebug: { value: 0 },
    };
    const circle = new Mesh(
      new PlaneGeometry(6, 6),
      new ShaderMaterial({
        uniforms,
        transparent: true,
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
          uniform float uTime;
          uniform float uMode;
          uniform float uTwist;
          uniform float uDebug;
          varying vec2 vUv;
          const float TAU = 6.2831853;
          float band(float x, float center, float width) {
            return 1.0 - smoothstep(0.0, width, abs(x - center));
          }
          void main() {
            vec2 p = vUv * 2.0 - 1.0;
            float r = length(p);
            float theta = atan(p.y, p.x) / TAU + 0.5; // 0〜1
            if (uDebug > 0.5) {
              vec3 dbg = vec3(r, fract(theta), 0.1) * (1.0 - smoothstep(0.98, 1.0, r));
              gl_FragColor = vec4(dbg * 0.8, 1.0);
              return;
            }
            // 直交座標モードでは、r と θ のかわりに x と y をそのまま使う
            float R = uMode > 1.5 ? p.x * 0.5 + 0.5 : r;
            float A = uMode > 1.5 ? p.y * 0.5 + 0.5 : theta;
            vec3 color = vec3(0.0);
            if (uMode > 0.5 && uMode < 1.5) {
              float a = A + R * uTwist * 0.15 - uTime * 0.25;
              float arms = pow(0.5 + 0.5 * sin(a * TAU * 5.0), 3.0);
              float falloff = smoothstep(1.0, 0.2, R) * smoothstep(0.0, 0.15, R);
              color = mix(vec3(0.4, 0.2, 1.0), vec3(0.3, 0.95, 1.0), arms) * arms * falloff * 1.6;
              color += vec3(0.8, 0.9, 1.0) * smoothstep(0.18, 0.0, R) * 1.5;
            } else {
              float spin = A + uTime * 0.05;
              float counter = A - uTime * 0.08;
              float rings = band(R, 0.92, 0.012) + band(R, 0.78, 0.01) + band(R, 0.45, 0.01) + band(R, 0.3, 0.008);
              // 外周の帯に、角度で区切ったルーン風の記号を並べる
              float cell = floor(spin * 28.0);
              vec2 local = vec2(fract(spin * 28.0), (R - 0.8) / 0.1);
              float glyph = 0.0;
              if (R > 0.8 && R < 0.9) {
                float h = hash12(vec2(cell, 3.0));
                glyph += band(local.x, 0.5, 0.06) * step(0.3, h);
                glyph += band(local.y, 0.2 + 0.6 * h, 0.08) * step(0.5, fract(h * 7.0));
                glyph += band(local.x + local.y, 0.8 + 0.4 * fract(h * 13.0), 0.07) * step(0.4, fract(h * 3.0));
                glyph *= step(0.15, local.x) * step(local.x, 0.85);
              }
              // 内側の星形：角度の三角関数で半径を変える
              float star = band(R, 0.45 * (0.62 + 0.38 * abs(cos(counter * TAU * 2.5))), 0.012);
              float spokes = band(fract(counter * 12.0), 0.5, 0.03) * step(0.45, R) * step(R, 0.78);
              float glow = rings + glyph * 0.9 + star + spokes * 0.5;
              color = vec3(0.35, 0.9, 1.0) * glow * 1.4;
              color += vec3(0.2, 0.5, 0.9) * smoothstep(0.95, 0.0, R) * 0.12;
            }
            color *= 1.0 - smoothstep(0.97, 1.0, uMode > 1.5 ? max(abs(p.x), abs(p.y)) : r);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
      })
    );
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.02;
    scene.add(circle);
    const crystal = new Mesh(
      new OctahedronGeometry(0.35),
      standard(palette.cyan, { emissive: 1.2, roughness: 0.2 })
    );
    crystal.position.y = 1.4;
    crystal.castShadow = true;
    scene.add(crystal);

    return {
      update({ dt, time }) {
        uniforms.uTime.value += dt * Number(params["speed"]) * 4;
        const mode = String(params["mode"]);
        uniforms.uMode.value =
          mode === "vortex"
            ? modes.vortex
            : mode === "cartesian"
              ? modes.cartesian
              : modes.circle;
        uniforms.uTwist.value = Number(params["twist"]);
        uniforms.uDebug.value = params["debug"] === true ? 1 : 0;
        crystal.rotation.y = time * 0.8;
        crystal.position.y = 1.4 + Math.sin(time * 1.5) * 0.12;
        crystal.visible = mode !== "cartesian";
        context.readout("変換", "r = |p|、θ = atan2(y, x)");
        context.caption(
          mode === "cartesian"
            ? "同じ式でも (x, y) をそのまま使うと、同心円は縦縞に、回転は平行移動になってしまう。"
            : mode === "vortex"
              ? "角度 θ に r × ねじれ を足すと、外側ほど角度がずれて腕が渦を巻く。θ に時間を足せば回転する。"
              : "距離 r で同心円の輪、角度 θ で放射状の区切りを作る。θ に時間を足すだけで模様全体が回転する。"
        );
      },
    };
  },
};
