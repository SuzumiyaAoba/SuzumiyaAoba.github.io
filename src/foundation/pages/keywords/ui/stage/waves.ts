import {
  Color,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Vector4,
} from "three";
import { rng, TAU } from "./kit";

const GRAVITY = 9.81;
export const MAX_WAVES = 12;

export type Wave = {
  angle: number;
  wavelength: number;
  amplitude: number;
  phase: number;
};

/** 風向きの周りに散らばった、波長と振幅の違う波の集合。 */
export function waveSet(
  options: {
    seed?: number;
    wavelength?: number;
    amplitude?: number;
    spread?: number;
  } = {}
) {
  const random = rng(options.seed ?? 3);
  const wavelength = options.wavelength ?? 8;
  const amplitude = options.amplitude ?? 0.35;
  const spread = options.spread ?? 0.9;
  return Array.from({ length: MAX_WAVES }, (_, index): Wave => {
    const falloff = 0.78 ** index;
    return {
      angle: (random() - 0.5) * spread * 2,
      wavelength:
        wavelength * (0.35 + 0.65 * falloff) * (0.85 + random() * 0.3),
      amplitude: amplitude * falloff * (0.8 + random() * 0.4),
      phase: random() * TAU,
    };
  });
}

/** GLSL に渡すための配列（dirX, dirZ, k, 振幅）と位相。 */
export function waveUniforms(waves: readonly Wave[]) {
  return {
    uWaves: {
      value: waves.map(
        (wave) =>
          new Vector4(
            Math.cos(wave.angle),
            Math.sin(wave.angle),
            TAU / wave.wavelength,
            wave.amplitude
          )
      ),
    },
    uPhases: { value: waves.map((wave) => wave.phase) },
    uWaveCount: { value: waves.length },
    uSteepness: { value: 0.6 },
    uAmplitudeScale: { value: 1 },
    uGerstner: { value: 1 },
    uTime: { value: 0 },
  };
}

/**
 * ゲルストナー波の GLSL。gerstner(p, normal, jacobian) は、元の水平位置 p の
 * 水面の点が移動した先の位置を返す。jacobian が小さい（0 に近い）ほど波頭が尖る。
 */
export const glslGerstner = /* glsl */ `
  uniform vec4 uWaves[${MAX_WAVES}];
  uniform float uPhases[${MAX_WAVES}];
  uniform float uWaveCount;
  uniform float uSteepness;
  uniform float uAmplitudeScale;
  uniform float uGerstner;
  uniform float uTime;
  vec3 gerstner(vec2 p, out vec3 normal, out float jacobian) {
    vec3 offset = vec3(0.0);
    vec3 n = vec3(0.0, 1.0, 0.0);
    float jxx = 1.0;
    float jzz = 1.0;
    float jxz = 0.0;
    for (int i = 0; i < ${MAX_WAVES}; i++) {
      if (float(i) >= uWaveCount) break;
      vec2 d = uWaves[i].xy;
      float k = uWaves[i].z;
      float a = uWaves[i].w * uAmplitudeScale;
      float omega = sqrt(${GRAVITY.toFixed(2)} * k);
      float theta = k * dot(d, p) - omega * uTime + uPhases[i];
      // 各波の尖り（波の数で割って、重なっても輪にならないようにする）
      float q = uGerstner * uSteepness / max(k * a * uWaveCount, 1e-4);
      float s = sin(theta);
      float c = cos(theta);
      offset.x += q * a * d.x * c;
      offset.z += q * a * d.y * c;
      offset.y += a * s;
      n.x -= d.x * k * a * c;
      n.z -= d.y * k * a * c;
      n.y -= q * k * a * s;
      jxx -= q * k * a * d.x * d.x * s;
      jzz -= q * k * a * d.y * d.y * s;
      jxz -= q * k * a * d.x * d.y * s;
    }
    normal = normalize(n);
    jacobian = jxx * jzz - jxz * jxz;
    return vec3(p.x, 0.0, p.y) + offset;
  }
`;

type WaveState = ReturnType<typeof waveUniforms>;

/** CPU 側で同じ波を評価する（元の位置 → 移動後の位置）。 */
export function gerstnerPoint(state: WaveState, x: number, z: number) {
  let ox = 0;
  let oy = 0;
  let oz = 0;
  const count = state.uWaveCount.value;
  for (let index = 0; index < count; index++) {
    const wave = state.uWaves.value[index];
    if (!wave) {
      continue;
    }
    const k = wave.z;
    const a = wave.w * state.uAmplitudeScale.value;
    const omega = Math.sqrt(GRAVITY * k);
    const theta =
      k * (wave.x * x + wave.y * z) -
      omega * state.uTime.value +
      (state.uPhases.value[index] ?? 0);
    const q =
      (state.uGerstner.value * state.uSteepness.value) /
      Math.max(k * a * count, 1e-4);
    ox += q * a * wave.x * Math.cos(theta);
    oz += q * a * wave.y * Math.cos(theta);
    oy += a * Math.sin(theta);
  }
  return { x: x + ox, y: oy, z: z + oz };
}

/** 水平位置 (x, z) の真上の水面の高さ（水平移動を数回の反復で打ち消して求める）。 */
export function waterHeight(state: WaveState, x: number, z: number) {
  let sx = x;
  let sz = z;
  let point = gerstnerPoint(state, sx, sz);
  for (let iteration = 0; iteration < 4; iteration++) {
    sx -= point.x - x;
    sz -= point.z - z;
    point = gerstnerPoint(state, sx, sz);
  }
  return point.y;
}

/**
 * ゲルストナー波で動く海面。options.foam が true なら波頭を白くする。
 */
export function oceanSurface(
  state: WaveState,
  options: {
    size?: number;
    segments?: number;
    color?: string;
    foam?: boolean;
  } = {}
) {
  const size = options.size ?? 40;
  const geometry = new PlaneGeometry(
    size,
    size,
    options.segments ?? 256,
    options.segments ?? 256
  );
  geometry.rotateX(-Math.PI / 2);
  const foamUniform = { value: options.foam ? 1 : 0 };
  const material = new MeshStandardMaterial({
    color: new Color(options.color ?? "#0f4c6b"),
    roughness: 0.12,
    metalness: 0,
  });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, state, { uFoam: foamUniform });
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>\n${glslGerstner}\nvarying float vJacobian;\nvarying float vCrest;`
      )
      .replace(
        "#include <beginnormal_vertex>",
        `vec3 waveNormal;
        float waveJacobian;
        vec3 wavePosition = gerstner(position.xz, waveNormal, waveJacobian);
        vec3 objectNormal = waveNormal;
        vJacobian = waveJacobian;
        vCrest = wavePosition.y;`
      )
      .replace("#include <begin_vertex>", "vec3 transformed = wavePosition;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uFoam;\nvarying float vJacobian;\nvarying float vCrest;"
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        // 波の山ほど明るい緑青に、尖った波頭（ヤコビアンが小さい所）は白い泡に
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.3, 1.7, 1.5), smoothstep(-0.3, 0.6, vCrest) * 0.6);
        float foam = uFoam * smoothstep(0.55, 0.15, vJacobian);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.95, 0.97), foam);`
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.7, uFoam * smoothstep(0.55, 0.15, vJacobian));"
      );
  };
  material.customProgramCacheKey = () =>
    `ocean-${options.foam ? "foam" : "plain"}`;
  const mesh = new Mesh(geometry, material);
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return Object.assign(mesh, { foam: foamUniform });
}
