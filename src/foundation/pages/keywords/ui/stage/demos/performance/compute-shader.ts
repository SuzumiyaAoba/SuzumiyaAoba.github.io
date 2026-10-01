import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  FloatType,
  Points,
  RGBAFormat,
  ShaderMaterial,
} from "three";
import type { Texture } from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import type { Variable } from "three/addons/misc/GPUComputationRenderer.js";
import { palette, rng } from "../../kit";
import type { DemoModule } from "../../types";
import { historyGraph } from "../../widgets";

/** 流れの場（ABC 流れ：各成分が自分の座標によらないので、発散が 0 の渦巻く流れ）と、殻へ引き寄せる力。 */
const FLOW_GLSL = /* glsl */ `
  vec3 flow(vec3 p, float t) {
    vec3 f = vec3(
      sin(p.y * 1.3 + t * 0.3) + cos(p.z * 1.1 - t * 0.2),
      sin(p.z * 1.5 + t * 0.4) + cos(p.x * 1.2 + t * 0.1),
      sin(p.x * 1.4 + t * 0.5) + cos(p.y * 1.6 - t * 0.3)
    ) * 0.9;
    float r = max(length(p), 1e-3);
    return f - p / r * (r - 2.4) * 1.6;
  }
`;

const velocityShader = /* glsl */ `
  uniform float uTime;
  uniform float uDt;
  ${FLOW_GLSL}
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 p = texture2D(texturePosition, uv).xyz;
    vec3 v = texture2D(textureVelocity, uv).xyz;
    v = mix(v, flow(p, uTime), 1.0 - exp(-uDt * 2.0));
    gl_FragColor = vec4(v, 1.0);
  }
`;
const positionShader = /* glsl */ `
  uniform float uDt;
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec3 p = texture2D(texturePosition, uv).xyz;
    vec3 v = texture2D(textureVelocity, uv).xyz;
    gl_FragColor = vec4(p + v * uDt, 1.0);
  }
`;

/** CPU 版の同じ計算。 */
function flowCpu(
  x: number,
  y: number,
  z: number,
  t: number,
  out: Float32Array,
  o: number
) {
  let fx = (Math.sin(y * 1.3 + t * 0.3) + Math.cos(z * 1.1 - t * 0.2)) * 0.9;
  let fy = (Math.sin(z * 1.5 + t * 0.4) + Math.cos(x * 1.2 + t * 0.1)) * 0.9;
  let fz = (Math.sin(x * 1.4 + t * 0.5) + Math.cos(y * 1.6 - t * 0.3)) * 0.9;
  const r = Math.max(Math.hypot(x, y, z), 1e-3);
  const pull = ((r - 2.4) * 1.6) / r;
  fx -= x * pull;
  fy -= y * pull;
  fz -= z * pull;
  out[o] = fx;
  out[o + 1] = fy;
  out[o + 2] = fz;
}

const SIZES = [128, 256, 512] as const;

export const demo: DemoModule = {
  alt: "大量の粒子の位置と速度の計算を、GPU で並列に行うデモ。粒子 1 個ごとの計算は同じで互いに独立しているので、GPU の何千もの演算器で一斉に計算できる。同じ計算を CPU で 1 個ずつ行う場合と、1 フレームの更新にかかる時間を比べる。WebGL にはコンピュートシェーダーがないので、このデモでは、位置と速度をテクスチャに入れ、画素ごとのシェーダー（フラグメントシェーダー）で計算して別のテクスチャに書く、昔ながらの方法（GPGPU）で同じことをしている。",
  camera: {
    position: [0, 2.5, 8.5],
    target: [0, 0, 0],
    fov: 45,
    autoRotate: 8,
  },
  studio: { floor: false, background: "#05080d" },
  controls: [
    {
      type: "select",
      key: "device",
      label: "計算する場所",
      value: "gpu",
      options: [
        { value: "gpu", label: "GPU（並列）" },
        { value: "cpu", label: "CPU（1 個ずつ）" },
      ],
    },
    {
      type: "select",
      key: "size",
      label: "粒子の数",
      value: "256",
      options: [
        { value: "128", label: "16,384" },
        { value: "256", label: "65,536" },
        { value: "512", label: "262,144" },
      ],
    },
  ],
  legend: [
    { color: palette.sky, label: "遅い粒子" },
    { color: palette.amber, label: "速い粒子" },
  ],
  setup(context) {
    const { scene, params, renderer } = context;
    const material = new ShaderMaterial({
      uniforms: {
        uPosition: { value: null as Texture | null },
        uVelocity: { value: null as Texture | null },
        uPointSize: { value: 1.6 * Math.min(2, window.devicePixelRatio || 1) },
      },
      vertexShader: /* glsl */ `
        attribute vec2 reference;
        uniform sampler2D uPosition;
        uniform sampler2D uVelocity;
        uniform float uPointSize;
        varying float vSpeed;
        void main() {
          vec3 p = texture2D(uPosition, reference).xyz;
          vSpeed = length(texture2D(uVelocity, reference).xyz);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uPointSize;
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vSpeed;
        void main() {
          vec3 slow = vec3(0.24, 0.55, 1.0);
          vec3 fast = vec3(1.0, 0.7, 0.3);
          gl_FragColor = vec4(mix(slow, fast, clamp(vSpeed / 2.4, 0.0, 1.0)) * 0.35, 1.0);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const graph = historyGraph(context, {
      title: "1 フレームの更新時間（ミリ秒、CPU 側）",
      min: 0,
      max: 20,
      series: [{ color: palette.amber }],
    });

    let size = 0;
    let points: Points | null = null;
    let gpu: GPUComputationRenderer | null = null;
    let positionVar: Variable | null = null;
    let velocityVar: Variable | null = null;
    let cpuPosition = new Float32Array(0);
    let cpuVelocity = new Float32Array(0);
    let cpuPositionTexture: DataTexture | null = null;
    let cpuVelocityTexture: DataTexture | null = null;
    const flowOut = new Float32Array(3);
    let simTime = 0;
    let smoothed = 0;
    let fps = 60;

    const rebuild = (nextSize: number) => {
      size = nextSize;
      if (points) {
        scene.remove(points);
        points.geometry.dispose();
      }
      gpu?.dispose();
      cpuPositionTexture?.dispose();
      cpuVelocityTexture?.dispose();
      const count = size * size;
      const random = rng(3);
      cpuPosition = new Float32Array(count * 4);
      cpuVelocity = new Float32Array(count * 4);
      for (let i = 0; i < count; i++) {
        // 球の内側にばらまく
        let x = 0;
        let y = 0;
        let z = 0;
        do {
          x = random() * 2 - 1;
          y = random() * 2 - 1;
          z = random() * 2 - 1;
        } while (x * x + y * y + z * z > 1);
        cpuPosition.set([x * 2.4, y * 2.4, z * 2.4, 1], i * 4);
      }
      gpu = new GPUComputationRenderer(size, size, renderer);
      const position0 = gpu.createTexture();
      const velocity0 = gpu.createTexture();
      position0.image.data?.set(cpuPosition);
      positionVar = gpu.addVariable(
        "texturePosition",
        positionShader,
        position0
      );
      velocityVar = gpu.addVariable(
        "textureVelocity",
        velocityShader,
        velocity0
      );
      gpu.setVariableDependencies(positionVar, [positionVar, velocityVar]);
      gpu.setVariableDependencies(velocityVar, [positionVar, velocityVar]);
      positionVar.material.uniforms["uDt"] = { value: 0 };
      velocityVar.material.uniforms["uDt"] = { value: 0 };
      velocityVar.material.uniforms["uTime"] = { value: 0 };
      const error = gpu.init();
      if (error !== null) {
        throw new Error(error);
      }
      cpuPositionTexture = new DataTexture(
        cpuPosition,
        size,
        size,
        RGBAFormat,
        FloatType
      );
      cpuVelocityTexture = new DataTexture(
        cpuVelocity,
        size,
        size,
        RGBAFormat,
        FloatType
      );
      cpuPositionTexture.needsUpdate = true;
      cpuVelocityTexture.needsUpdate = true;
      const reference = new Float32Array(count * 2);
      for (let j = 0; j < size; j++) {
        for (let i = 0; i < size; i++) {
          reference.set(
            [(i + 0.5) / size, (j + 0.5) / size],
            (j * size + i) * 2
          );
        }
      }
      const geometry = new BufferGeometry();
      geometry.setAttribute(
        "position",
        new BufferAttribute(new Float32Array(count * 3), 3)
      );
      geometry.setAttribute("reference", new BufferAttribute(reference, 2));
      points = new Points(geometry, material);
      points.frustumCulled = false;
      scene.add(points);
    };

    return {
      update({ dt }) {
        const nextSize = Number(params["size"]);
        if (nextSize !== size && SIZES.some((s) => s === nextSize)) {
          rebuild(nextSize);
        }
        const step = Math.min(dt, 1 / 30);
        simTime += step;
        const onGpu = params["device"] !== "cpu";
        const start = performance.now();
        if (onGpu && gpu && positionVar && velocityVar) {
          const velocityUniforms = velocityVar.material.uniforms;
          const positionUniforms = positionVar.material.uniforms;
          if (
            velocityUniforms["uDt"] &&
            velocityUniforms["uTime"] &&
            positionUniforms["uDt"]
          ) {
            velocityUniforms["uDt"].value = step;
            velocityUniforms["uTime"].value = simTime;
            positionUniforms["uDt"].value = step;
          }
          gpu.compute();
          material.uniforms["uPosition"] = {
            value: gpu.getCurrentRenderTarget(positionVar).texture,
          };
          material.uniforms["uVelocity"] = {
            value: gpu.getCurrentRenderTarget(velocityVar).texture,
          };
        } else if (cpuPositionTexture && cpuVelocityTexture) {
          // 同じ計算を CPU で 1 個ずつ
          const count = size * size;
          const blend = 1 - Math.exp(-step * 2);
          for (let i = 0; i < count; i++) {
            const o = i * 4;
            const x = cpuPosition[o] ?? 0;
            const y = cpuPosition[o + 1] ?? 0;
            const z = cpuPosition[o + 2] ?? 0;
            flowCpu(x, y, z, simTime, flowOut, 0);
            const vx =
              (cpuVelocity[o] ?? 0) +
              ((flowOut[0] ?? 0) - (cpuVelocity[o] ?? 0)) * blend;
            const vy =
              (cpuVelocity[o + 1] ?? 0) +
              ((flowOut[1] ?? 0) - (cpuVelocity[o + 1] ?? 0)) * blend;
            const vz =
              (cpuVelocity[o + 2] ?? 0) +
              ((flowOut[2] ?? 0) - (cpuVelocity[o + 2] ?? 0)) * blend;
            cpuVelocity[o] = vx;
            cpuVelocity[o + 1] = vy;
            cpuVelocity[o + 2] = vz;
            cpuPosition[o] = x + vx * step;
            cpuPosition[o + 1] = y + vy * step;
            cpuPosition[o + 2] = z + vz * step;
          }
          cpuPositionTexture.needsUpdate = true;
          cpuVelocityTexture.needsUpdate = true;
          material.uniforms["uPosition"] = { value: cpuPositionTexture };
          material.uniforms["uVelocity"] = { value: cpuVelocityTexture };
        }
        const elapsed = performance.now() - start;
        smoothed += (elapsed - smoothed) * 0.1;
        fps += (1 / Math.max(dt, 1e-3) - fps) * 0.05;
        graph.push([smoothed]);
        context.readout("粒子の数", (size * size).toLocaleString());
        context.readout(
          "更新にかかった時間（CPU 側）",
          `${smoothed.toFixed(2)} ms`
        );
        context.readout("フレームレート", `${fps.toFixed(0)} fps`);
        context.caption(
          onGpu
            ? "GPU では、粒子 1 個ごとの計算（流れの場を読んで速度と位置を更新）を、何千もの演算器で一斉に行う。CPU は命令を出すだけなので、CPU 側の時間はほとんどかからない。位置と速度は、読むテクスチャと書くテクスチャを毎フレーム入れ替えて保持している（ピンポンバッファ）。"
            : "同じ計算を CPU で 1 個ずつ行うと、粒子の数に比例して時間がかかる。26 万個では、1 フレームの予算（60 fps なら 16.7 ms）の大半を、この計算だけで使ってしまう。結果を毎フレーム GPU へ送り直す時間もかかる。"
        );
      },
      dispose() {
        gpu?.dispose();
        cpuPositionTexture?.dispose();
        cpuVelocityTexture?.dispose();
        points?.geometry.dispose();
        material.dispose();
      },
    };
  },
};
