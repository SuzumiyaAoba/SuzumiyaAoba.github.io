import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  NormalBlending,
  PlaneGeometry,
  Points,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { ColorRepresentation, Object3D } from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

/** 全デモ共通の配色。暗いステージ上での判別しやすさを優先している。 */
export const palette = {
  background: "#0a0f17",
  backgroundTop: "#172233",
  ink: "#e8eef6",
  muted: "#8494aa",
  faint: "#2b3748",
  base: "#cfd6e2",
  cyan: "#3fd6c6",
  sky: "#5aa9ff",
  amber: "#f7b64c",
  coral: "#f5736f",
  violet: "#a88bfa",
  lime: "#a6e052",
  pink: "#f58fc7",
} as const;

export const TAU = Math.PI * 2;

export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};
export const fract = (value: number) => value - Math.floor(value);

/** 再現性のある乱数（mulberry32）。 */
export function rng(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d_2b_79_f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** 整数格子のハッシュから 0〜1 を返す。 */
export const hash2 = (x: number, y: number) =>
  fract(Math.sin(x * 127.1 + y * 311.7) * 43_758.545);
export const hash3 = (x: number, y: number, z: number) =>
  fract(Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43_758.545);

const gradients2 = Array.from({ length: 16 }, (_, index) => {
  const angle = (index / 16) * TAU;
  return [Math.cos(angle), Math.sin(angle)] as const;
});

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

const gradientDot = (ix: number, iy: number, x: number, y: number) => {
  const g = gradients2[Math.floor(hash2(ix, iy) * 16) % 16] ?? [1, 0];
  return g[0] * (x - ix) + g[1] * (y - iy);
};

/** 2 次元パーリン（勾配）ノイズ。おおよそ -0.7〜0.7。 */
export function perlin2(x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const u = fade(x - x0);
  const v = fade(y - y0);
  const a = mix(gradientDot(x0, y0, x, y), gradientDot(x0 + 1, y0, x, y), u);
  const b = mix(
    gradientDot(x0, y0 + 1, x, y),
    gradientDot(x0 + 1, y0 + 1, x, y),
    u
  );
  return mix(a, b, v);
}

/** 3 次元値ノイズ（0〜1）。 */
export function valueNoise3(x: number, y: number, z: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const u = fade(x - x0);
  const v = fade(y - y0);
  const w = fade(z - z0);
  const corner = (dx: number, dy: number, dz: number) =>
    hash3(x0 + dx, y0 + dy, z0 + dz);
  return mix(
    mix(
      mix(corner(0, 0, 0), corner(1, 0, 0), u),
      mix(corner(0, 1, 0), corner(1, 1, 0), u),
      v
    ),
    mix(
      mix(corner(0, 0, 1), corner(1, 0, 1), u),
      mix(corner(0, 1, 1), corner(1, 1, 1), u),
      v
    ),
    w
  );
}

export function fbm2(x: number, y: number, octaves = 5) {
  let sum = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let octave = 0; octave < octaves; octave++) {
    sum += perlin2(x * frequency, y * frequency) * amplitude;
    frequency *= 2;
    amplitude *= 0.5;
  }
  return sum;
}

/** 標準的な PBR マテリアル。 */
export function standard(
  color: ColorRepresentation,
  options: { roughness?: number; metalness?: number; emissive?: number } = {}
) {
  const material = new MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.55,
    metalness: options.metalness ?? 0.05,
  });
  if (options.emissive !== undefined) {
    material.emissive = new Color(color);
    material.emissiveIntensity = options.emissive;
  }
  return material;
}

/** 発光する小球（目標点や制御点の表示に使う）。 */
export function marker(color: ColorRepresentation, radius = 0.08) {
  const mesh = new Mesh(
    new SphereGeometry(radius, 24, 16),
    standard(color, { emissive: 0.6, roughness: 0.3 })
  );
  mesh.castShadow = true;
  return mesh;
}

type LineOptions = {
  width?: number;
  opacity?: number;
  dashed?: boolean;
  dashSize?: number;
  gapSize?: number;
};

const lineMaterial = (color: ColorRepresentation, options: LineOptions) => {
  const material = new LineMaterial({
    color: new Color(color).getHex(),
    linewidth: options.width ?? 2,
    transparent: (options.opacity ?? 1) < 1,
    opacity: options.opacity ?? 1,
    dashed: options.dashed ?? false,
    dashSize: options.dashSize ?? 0.12,
    gapSize: options.gapSize ?? 0.08,
    worldUnits: false,
  });
  return material;
};

const flatten = (points: readonly Vector3[]) => {
  const values: number[] = [];
  for (const point of points) {
    values.push(point.x, point.y, point.z);
  }
  return values;
};

/** 太さを持つ折れ線。setPoints で頂点を差し替えられる。 */
export function polyline(
  points: readonly Vector3[],
  color: ColorRepresentation,
  options: LineOptions = {}
) {
  const geometry = new LineGeometry();
  geometry.setPositions(
    flatten(points.length > 1 ? points : [new Vector3(), new Vector3()])
  );
  const line = new Line2(geometry, lineMaterial(color, options));
  line.computeLineDistances();
  const setPoints = (next: readonly Vector3[]) => {
    const replacement = new LineGeometry();
    replacement.setPositions(
      flatten(next.length > 1 ? next : [new Vector3(), new Vector3()])
    );
    line.geometry.dispose();
    line.geometry = replacement;
    line.computeLineDistances();
  };
  return Object.assign(line, { setPoints });
}

/** 独立した線分の集合（2 点ずつ）。 */
export function segments(
  points: readonly Vector3[],
  color: ColorRepresentation,
  options: LineOptions = {}
) {
  const geometry = new LineSegmentsGeometry();
  geometry.setPositions(
    flatten(points.length > 1 ? points : [new Vector3(), new Vector3()])
  );
  const line = new LineSegments2(geometry, lineMaterial(color, options));
  const setPoints = (next: readonly Vector3[]) => {
    const replacement = new LineSegmentsGeometry();
    replacement.setPositions(
      flatten(next.length > 1 ? next : [new Vector3(), new Vector3()])
    );
    line.geometry.dispose();
    line.geometry = replacement;
    line.computeLineDistances();
  };
  return Object.assign(line, { setPoints });
}

const up = new Vector3(0, 1, 0);
const tmpQuaternion = new Quaternion();

/** 太い矢印。set(origin, vector) で向きと長さを変えられる。 */
export function arrow(
  color: ColorRepresentation,
  options: {
    radius?: number;
    headLength?: number;
    emissive?: number;
    /** 他の物体に隠れず常に手前に描く。 */
    overlay?: boolean;
  } = {}
) {
  const radius = options.radius ?? 0.022;
  const headLength = options.headLength ?? 0.16;
  const material = standard(color, {
    emissive: options.emissive ?? 0.35,
    roughness: 0.4,
  });
  if (options.overlay ?? false) {
    material.depthTest = false;
    material.transparent = true;
  }
  const shaft = new Mesh(new CylinderGeometry(radius, radius, 1, 12), material);
  const head = new Mesh(new ConeGeometry(radius * 3, headLength, 16), material);
  shaft.castShadow = !(options.overlay ?? false);
  head.castShadow = !(options.overlay ?? false);
  if (options.overlay ?? false) {
    shaft.renderOrder = 10;
    head.renderOrder = 10;
  }
  const group = new Group();
  group.add(shaft, head);
  const direction = new Vector3();
  const set = (origin: Vector3, vector: Vector3) => {
    const length = vector.length();
    group.visible = length > 1e-4;
    if (!group.visible) {
      return;
    }
    direction.copy(vector).divideScalar(length);
    const head_ = Math.min(headLength, length * 0.5);
    const shaftLength = Math.max(1e-3, length - head_);
    group.position.copy(origin);
    tmpQuaternion.setFromUnitVectors(up, direction);
    group.quaternion.copy(tmpQuaternion);
    shaft.scale.set(1, shaftLength, 1);
    shaft.position.set(0, shaftLength / 2, 0);
    head.scale.set(1, head_ / headLength, 1);
    head.position.set(0, shaftLength + head_ / 2, 0);
  };
  return Object.assign(group, { set, material });
}

let glowTexture: CanvasTexture | undefined;

/** 柔らかい光点のテクスチャ（加算合成の粒子用）。 */
export function glowSprite() {
  if (glowTexture) {
    return glowTexture;
  }
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.25, "rgba(255,255,255,0.65)");
    gradient.addColorStop(0.6, "rgba(255,255,255,0.12)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  glowTexture = new CanvasTexture(canvas);
  glowTexture.colorSpace = SRGBColorSpace;
  return glowTexture;
}

/**
 * 点群。位置と色を毎フレーム書き換える用途向け。
 * 丸く柔らかい見た目のシェーダーを使う。
 */
export function pointCloud(
  count: number,
  options: {
    size?: number;
    color?: ColorRepresentation;
    additive?: boolean;
    opacity?: number;
  } = {}
) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count).fill(1);
  const base = new Color(options.color ?? palette.ink);
  for (let index = 0; index < count; index++) {
    colors[index * 3] = base.r;
    colors[index * 3 + 1] = base.g;
    colors[index * 3 + 2] = base.b;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.setAttribute("size", new BufferAttribute(sizes, 1));
  const additive = options.additive ?? false;
  const material = new ShaderMaterial({
    uniforms: {
      uSize: { value: options.size ?? 6 },
      uOpacity: { value: options.opacity ?? 1 },
      uPixelRatio: { value: Math.min(2, window.devicePixelRatio || 1) },
    },
    vertexShader: /* glsl */ `
      attribute float size;
      varying vec3 vColor;
      uniform float uSize;
      uniform float uPixelRatio;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * size * uPixelRatio * (4.0 / max(0.1, -mv.z));
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      uniform float uOpacity;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        ${
          additive
            ? "float a = smoothstep(0.5, 0.0, d); a *= a;"
            : "float a = 1.0 - smoothstep(0.4, 0.5, d);"
        }
        if (a < 0.01) discard;
        gl_FragColor = vec4(vColor, a * uOpacity);
        #include <colorspace_fragment>
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: !additive,
    blending: additive ? AdditiveBlending : NormalBlending,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  const commit = () => {
    const position = geometry.getAttribute("position");
    const color = geometry.getAttribute("color");
    const size = geometry.getAttribute("size");
    position.needsUpdate = true;
    color.needsUpdate = true;
    size.needsUpdate = true;
  };
  return Object.assign(points, {
    positions,
    colors,
    sizes,
    commit,
    shader: material,
  });
}

/** 地面に置く半透明の板（領域の強調表示用）。 */
export function panel(
  width: number,
  depth: number,
  color: ColorRepresentation,
  opacity = 0.18
) {
  const mesh = new Mesh(
    new PlaneGeometry(width, depth),
    new MeshStandardMaterial({
      color,
      transparent: true,
      opacity,
      side: DoubleSide,
      depthWrite: false,
      roughness: 1,
    })
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

/** HSL のグラデーション上の色を返す（0〜1）。 */
export function ramp(
  t: number,
  stops: readonly ColorRepresentation[] = [
    palette.background,
    palette.sky,
    palette.cyan,
    palette.ink,
  ]
) {
  const clamped = clamp(t) * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(clamped));
  const from = new Color(stops[index] ?? palette.ink);
  const to = new Color(stops[index + 1] ?? palette.ink);
  return from.lerp(to, clamped - index);
}

const terrainStops = [
  [0, "#123a5c"],
  [0.3, "#2a7f9e"],
  [0.36, "#d8c48f"],
  [0.42, "#6aa04f"],
  [0.6, "#3f7240"],
  [0.74, "#7c7266"],
  [0.86, "#9d958a"],
  [0.93, "#eef2f6"],
] as const;

/** 標高（0〜1）と傾き（0 = 平ら〜1 = 垂直）から地形の色を決める。 */
export function terrainColor(height01: number, slope: number, out: Color) {
  const h = clamp(height01);
  let index = 0;
  while (
    index < terrainStops.length - 2 &&
    h > (terrainStops[index + 1]?.[0] ?? 1)
  ) {
    index++;
  }
  const [h0, c0] = terrainStops[index] ?? terrainStops[0];
  const [h1, c1] = terrainStops[index + 1] ?? terrainStops[0];
  out.set(c0).lerp(new Color(c1), clamp((h - h0) / Math.max(1e-4, h1 - h0)));
  if (h > 0.36 && slope > 0.55) {
    out.lerp(new Color("#6f675d"), clamp((slope - 0.55) * 3));
  }
  return out;
}

/** 子孫のジオメトリとマテリアルを破棄する。 */
export function disposeObject(root: Object3D) {
  root.traverse((child) => {
    const candidate = child as Object3D & {
      geometry?: { dispose: () => void };
      material?: { dispose: () => void } | { dispose: () => void }[];
    };
    candidate.geometry?.dispose();
    const { material } = candidate;
    if (Array.isArray(material)) {
      for (const item of material) {
        item.dispose();
      }
    } else {
      material?.dispose();
    }
  });
}

export const v3 = (x = 0, y = 0, z = 0) => new Vector3(x, y, z);

/** 通った位置を記録して、先端ほど明るい光の尾を描く（加算合成）。 */
export function trail(
  length: number,
  color: ColorRepresentation,
  options: { width?: number } = {}
) {
  const base = new Color(color);
  const history: Vector3[] = [];
  const material = new LineMaterial({
    vertexColors: true,
    linewidth: options.width ?? 3,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    worldUnits: false,
  });
  const line = new Line2(new LineGeometry(), material);
  line.frustumCulled = false;
  line.visible = false;
  const rebuild = () => {
    if (history.length < 2) {
      line.visible = false;
      return;
    }
    const positions: number[] = [];
    const colors: number[] = [];
    for (const [index, point] of history.entries()) {
      const strength = ((index + 1) / history.length) ** 1.6;
      positions.push(point.x, point.y, point.z);
      colors.push(base.r * strength, base.g * strength, base.b * strength);
    }
    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colors);
    line.geometry.dispose();
    line.geometry = geometry;
    line.visible = true;
  };
  const push = (point: Vector3) => {
    history.push(point.clone());
    while (history.length > length) {
      history.shift();
    }
    rebuild();
  };
  const reset = () => {
    history.length = 0;
    rebuild();
  };
  return Object.assign(line, { push, reset });
}
