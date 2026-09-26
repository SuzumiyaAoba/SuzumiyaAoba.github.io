import {
  BufferAttribute,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { clamp } from "./kit";

/**
 * CPU 側で反射モデルを評価する関数群（グラフや反射分布の立体表示に使う）。
 * 角度はすべてラジアン、粗さ roughness は見た目の粗さ（α = roughness²）。
 */

/** GGX（Trowbridge–Reitz）の法線分布関数 D。 */
export function ggxD(cosH: number, roughness: number) {
  const alpha = Math.max(roughness * roughness, 1e-3);
  const a2 = alpha * alpha;
  const d = cosH * cosH * (a2 - 1) + 1;
  return a2 / (Math.PI * d * d);
}

/** Beckmann 分布。 */
export function beckmannD(cosH: number, roughness: number) {
  const alpha = Math.max(roughness * roughness, 1e-3);
  const c2 = Math.max(cosH * cosH, 1e-6);
  const tan2 = (1 - c2) / c2;
  return (
    Math.exp(-tan2 / (alpha * alpha)) / (Math.PI * alpha * alpha * c2 * c2)
  );
}

/** 正規化した Blinn-Phong 分布（粗さから指数を決める一般的な対応）。 */
export function blinnPhongD(cosH: number, roughness: number) {
  const alpha = Math.max(roughness * roughness, 1e-3);
  const exponent = 2 / (alpha * alpha) - 2;
  return ((exponent + 2) / (2 * Math.PI)) * Math.max(cosH, 0) ** exponent;
}

/** Smith の幾何減衰（GGX 用、高さ相関なしの近似）。 */
export function smithG(cosL: number, cosV: number, roughness: number) {
  const k = ((roughness + 1) * (roughness + 1)) / 8;
  const g1 = (c: number) => c / (c * (1 - k) + k);
  return g1(Math.max(cosL, 1e-4)) * g1(Math.max(cosV, 1e-4));
}

/** Schlick のフレネル近似。 */
export const schlick = (cosTheta: number, f0: number) =>
  f0 + (1 - f0) * (1 - clamp(cosTheta)) ** 5;

/** 物理ベースの BRDF（Cook-Torrance の鏡面 + Lambert の拡散）を 1 チャンネルで評価する。 */
export function cookTorrance(
  normal: Vector3,
  light: Vector3,
  view: Vector3,
  options: {
    roughness: number;
    metalness: number;
    albedo: number;
    diffuse?: boolean;
    specular?: boolean;
  }
) {
  const cosL = normal.dot(light);
  const rawV = normal.dot(view);
  if (cosL <= 0 || rawV <= 0) {
    return 0;
  }
  const cosV = Math.max(rawV, 0.02);
  const half = light.clone().add(view).normalize();
  const cosH = Math.max(normal.dot(half), 0);
  const cosVH = Math.max(view.dot(half), 0);
  const f0 =
    options.metalness * options.albedo + (1 - options.metalness) * 0.04;
  const fresnel = schlick(cosVH, f0);
  const specular =
    (ggxD(cosH, options.roughness) *
      smithG(cosL, cosV, options.roughness) *
      fresnel) /
    (4 * cosL * cosV);
  const diffuse =
    ((1 - fresnel) * (1 - options.metalness) * options.albedo) / Math.PI;
  return (
    (options.diffuse === false ? 0 : diffuse) +
    (options.specular === false ? 0 : specular)
  );
}

/**
 * 反射分布（ローブ）を半球の変形で表す立体。
 * update(value) に出射方向 → 値の関数を渡すと、各方向の半径をその値に合わせる。
 */
export function lobeMesh(options: { radius?: number; segments?: number } = {}) {
  const segments = options.segments ?? 64;
  const geometry = new SphereGeometry(
    1,
    segments,
    segments / 2,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2
  );
  const position = geometry.getAttribute("position");
  const directions = Array.from({ length: position.count }, (_, index) =>
    new Vector3(
      position.getX(index),
      position.getY(index),
      position.getZ(index)
    ).normalize()
  );
  const colors = new Float32Array(position.count * 3);
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  const mesh = new Mesh(
    geometry,
    new MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      side: DoubleSide,
      depthWrite: false,
    })
  );
  const low = new Color("#1d3b8f");
  const high = new Color("#ffd27a");
  const tint = new Color();
  const scale = options.radius ?? 1;
  const update = (value: (direction: Vector3) => number) => {
    let max = 1e-6;
    const values = directions.map((direction) => {
      const v = Math.max(0, value(direction));
      max = Math.max(max, v);
      return v;
    });
    for (const [index, direction] of directions.entries()) {
      const v = values[index] ?? 0;
      const radius = scale * Math.sqrt(v / max);
      position.setXYZ(
        index,
        direction.x * radius,
        direction.y * radius,
        direction.z * radius
      );
      tint.copy(low).lerp(high, Math.sqrt(v / max));
      colors[index * 3] = tint.r;
      colors[index * 3 + 1] = tint.g;
      colors[index * 3 + 2] = tint.b;
    }
    position.needsUpdate = true;
    const color = geometry.getAttribute("color");
    color.needsUpdate = true;
    geometry.computeBoundingSphere();
    return max;
  };
  return Object.assign(mesh, { update });
}
