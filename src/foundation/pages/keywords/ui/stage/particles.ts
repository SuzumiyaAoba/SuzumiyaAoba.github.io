import {
  AdditiveBlending,
  CanvasTexture,
  DynamicDrawUsage,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  NormalBlending,
  PlaneGeometry,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
} from "three";
import type { Texture } from "three";
import { clamp, fbm2, glowSprite, mix, smoothstep } from "./kit";

export type ParticleMode = "billboard" | "stretched" | "fixed";

const attribute = (array: Float32Array, size: number) =>
  new InstancedBufferAttribute(array, size).setUsage(DynamicDrawUsage);

/**
 * 板ポリゴンの粒子をまとめて描く。各粒子の値は配列を直接書き換え、commit() で反映する。
 * mode: billboard = カメラへ向ける / stretched = 画面上の速度方向へ伸ばす / fixed = ワールドの XY 平面に固定
 */
export function particleSystem(options: {
  capacity: number;
  texture?: Texture;
  additive?: boolean;
  mode?: ParticleMode;
  /** フリップブックの分割数 [列, 行]。 */
  frames?: readonly [number, number];
  /** stretched での伸び率（速度 1 m/s あたりの倍率）。 */
  stretch?: number;
}) {
  const { capacity } = options;
  const geometry = new InstancedBufferGeometry();
  const quad = new PlaneGeometry(1, 1);
  geometry.index = quad.index;
  geometry.setAttribute("position", quad.getAttribute("position"));
  geometry.setAttribute("uv", quad.getAttribute("uv"));
  const positions = new Float32Array(capacity * 3);
  const velocities = new Float32Array(capacity * 3);
  const sizes = new Float32Array(capacity);
  const colors = new Float32Array(capacity * 4);
  const rotations = new Float32Array(capacity);
  const frames = new Float32Array(capacity);
  geometry.setAttribute("iPosition", attribute(positions, 3));
  geometry.setAttribute("iVelocity", attribute(velocities, 3));
  geometry.setAttribute("iSize", attribute(sizes, 1));
  geometry.setAttribute("iColor", attribute(colors, 4));
  geometry.setAttribute("iRotation", attribute(rotations, 1));
  geometry.setAttribute("iFrame", attribute(frames, 1));
  geometry.instanceCount = 0;
  const mode = options.mode ?? "billboard";
  const [cols, rows] = options.frames ?? [1, 1];
  const additive = options.additive ?? true;
  const material = new ShaderMaterial({
    uniforms: {
      uMap: { value: options.texture ?? glowSprite() },
      uFrames: { value: new Vector2(cols, rows) },
      uStretch: { value: options.stretch ?? 0.08 },
      uBlend: { value: 0 },
    },
    defines: {
      MODE_BILLBOARD: mode === "billboard" ? 1 : 0,
      MODE_STRETCHED: mode === "stretched" ? 1 : 0,
    },
    vertexShader: /* glsl */ `
      attribute vec3 iPosition;
      attribute vec3 iVelocity;
      attribute float iSize;
      attribute vec4 iColor;
      attribute float iRotation;
      attribute float iFrame;
      uniform vec2 uFrames;
      uniform float uStretch;
      varying vec2 vUv;
      varying vec2 vUvNext;
      varying float vFrameMix;
      varying vec4 vColor;
      vec2 frameUv(float frame) {
        frame = mod(frame, uFrames.x * uFrames.y);
        vec2 cell = vec2(mod(frame, uFrames.x), uFrames.y - 1.0 - floor(frame / uFrames.x));
        return (uv + cell) / uFrames;
      }
      void main() {
        vColor = iColor;
        float frame = floor(iFrame);
        vUv = frameUv(frame);
        vUvNext = frameUv(min(frame + 1.0, uFrames.x * uFrames.y - 1.0));
        vFrameMix = fract(iFrame);
        vec2 corner = position.xy;
        #if MODE_BILLBOARD
          float c = cos(iRotation);
          float s = sin(iRotation);
          vec2 rotated = vec2(c * corner.x - s * corner.y, s * corner.x + c * corner.y);
          vec4 mv = modelViewMatrix * vec4(iPosition, 1.0);
          mv.xy += rotated * iSize;
          gl_Position = projectionMatrix * mv;
        #elif MODE_STRETCHED
          vec4 mv = modelViewMatrix * vec4(iPosition, 1.0);
          vec3 viewVelocity = (modelViewMatrix * vec4(iVelocity, 0.0)).xyz;
          float speed = length(viewVelocity.xy);
          vec2 along = speed > 1e-4 ? viewVelocity.xy / speed : vec2(0.0, 1.0);
          // (across, along) が右手系になる向きにする（逆だと裏面として culling される）
          vec2 across = vec2(along.y, -along.x);
          float lengthScale = 1.0 + speed * uStretch / max(iSize, 1e-3);
          // 板の上端を粒子の位置に、下端を速度と逆向きに伸ばす（尾を引く）
          mv.xy += across * corner.x * iSize + along * (corner.y - 0.5) * iSize * lengthScale;
          gl_Position = projectionMatrix * mv;
        #else
          vec3 world = iPosition + vec3(corner * iSize, 0.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
        #endif
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uBlend;
      varying vec2 vUv;
      varying vec2 vUvNext;
      varying float vFrameMix;
      varying vec4 vColor;
      void main() {
        vec4 texel = texture2D(uMap, vUv);
        if (uBlend > 0.5) {
          texel = mix(texel, texture2D(uMap, vUvNext), vFrameMix);
        }
        vec4 color = texel * vColor;
        if (color.a < 0.003) discard;
        gl_FragColor = color;
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: additive ? AdditiveBlending : NormalBlending,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  let count = 0;
  const commit = () => {
    geometry.instanceCount = count;
    for (const name of [
      "iPosition",
      "iVelocity",
      "iSize",
      "iColor",
      "iRotation",
      "iFrame",
    ]) {
      const target = geometry.getAttribute(name);
      target.needsUpdate = true;
    }
  };
  const setCount = (value: number) => {
    count = Math.min(capacity, value);
  };
  const setStretch = (value: number) => {
    const uniform = material.uniforms["uStretch"];
    if (uniform) {
      uniform.value = value;
    }
  };
  const setFrameBlend = (enabled: boolean) => {
    const uniform = material.uniforms["uBlend"];
    if (uniform) {
      uniform.value = enabled ? 1 : 0;
    }
  };
  return Object.assign(mesh, {
    setStretch,
    setFrameBlend,
    positions,
    velocities,
    sizes,
    colors,
    rotations,
    frames,
    capacity,
    commit,
    setCount,
    shader: material,
  });
}

let smokeTexture: CanvasTexture | undefined;

/** 柔らかい煙のかたまり（アルファ付き）。 */
export function smokePuff() {
  if (smokeTexture) {
    return smokeTexture;
  }
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    const image = context.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size - 0.5;
        const v = y / size - 0.5;
        const distance = Math.hypot(u, v) * 2;
        const noise = fbm2(x * 0.045 + 3, y * 0.045 + 7, 5) * 0.9 + 0.5;
        const alpha = clamp(
          (1 - smoothstep(0.2, 1, distance + (0.5 - noise) * 0.55)) * 1.1
        );
        const shade = mix(170, 255, clamp(noise));
        const index = (y * size + x) * 4;
        image.data[index] = shade;
        image.data[index + 1] = shade;
        image.data[index + 2] = shade;
        image.data[index + 3] = alpha * 255;
      }
    }
    context.putImageData(image, 0, 0);
  }
  smokeTexture = new CanvasTexture(canvas);
  smokeTexture.colorSpace = SRGBColorSpace;
  return smokeTexture;
}

let explosionTexture: CanvasTexture | undefined;

/**
 * 爆発のフリップブック（4×4 = 16 コマ）。
 * 火球が膨らみ、赤く冷えて、煙になって消えるまでを手続き的に描く。
 */
export function explosionAtlas() {
  if (explosionTexture) {
    return explosionTexture;
  }
  const cell = 96;
  const grid = 4;
  const canvas = document.createElement("canvas");
  canvas.width = cell * grid;
  canvas.height = cell * grid;
  const context = canvas.getContext("2d");
  if (context) {
    const image = context.createImageData(cell * grid, cell * grid);
    for (let frame = 0; frame < grid * grid; frame++) {
      const t = frame / (grid * grid - 1);
      const radius = 0.25 + 0.55 * Math.sqrt(t);
      const heat = clamp(1 - t * 1.6);
      const ox = (frame % grid) * cell;
      const oy = Math.floor(frame / grid) * cell;
      for (let y = 0; y < cell; y++) {
        for (let x = 0; x < cell; x++) {
          const u = (x / cell - 0.5) * 2;
          const v = (y / cell - 0.5) * 2;
          const noise =
            fbm2(u * 2.2 + frame * 0.12, v * 2.2 - frame * 0.2, 5) + 0.5;
          const distance = Math.hypot(u, v) / radius + (0.5 - noise) * 0.7;
          const body = clamp(1 - smoothstep(0.55, 1, distance));
          const core = clamp(1 - smoothstep(0, 0.8, distance)) * heat;
          const smoke = mix(70, 40, t);
          const red = mix(smoke, 255, clamp(core * 1.4 + heat * 0.3));
          const green = mix(smoke, 200, clamp(core * 1.2 - 0.15));
          const blue = mix(smoke, 90, clamp(core - 0.5));
          const alpha = body * (t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3);
          const index = ((oy + y) * cell * grid + ox + x) * 4;
          image.data[index] = red;
          image.data[index + 1] = green;
          image.data[index + 2] = blue;
          image.data[index + 3] = alpha * 255;
        }
      }
    }
    context.putImageData(image, 0, 0);
  }
  explosionTexture = new CanvasTexture(canvas);
  explosionTexture.colorSpace = SRGBColorSpace;
  return explosionTexture;
}
