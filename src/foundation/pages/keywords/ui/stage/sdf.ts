import { Vector3 } from "three";

/** CPU 側で距離場を評価するための関数群（GLSL の glslSdf と同じ定義）。 */

export const sdSphere = (x: number, y: number, z: number, r: number) =>
  Math.hypot(x, y, z) - r;

export function sdBox(
  x: number,
  y: number,
  z: number,
  bx: number,
  by: number,
  bz: number
) {
  const qx = Math.abs(x) - bx;
  const qy = Math.abs(y) - by;
  const qz = Math.abs(z) - bz;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0));
  return outside + Math.min(Math.max(qx, qy, qz), 0);
}

export const sdTorus = (
  x: number,
  y: number,
  z: number,
  major: number,
  minor: number
) => Math.hypot(Math.hypot(x, z) - major, y) - minor;

export function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / Math.max(k, 1e-5);
  return Math.min(a, b) - h * h * k * 0.25;
}

/** 中心差分による勾配（正規化済み）。 */
export function gradient(
  field: (x: number, y: number, z: number) => number,
  point: Vector3,
  out = new Vector3(),
  epsilon = 1e-3
) {
  const { x, y, z } = point;
  out.set(
    field(x + epsilon, y, z) - field(x - epsilon, y, z),
    field(x, y + epsilon, z) - field(x, y - epsilon, z),
    field(x, y, z + epsilon) - field(x, y, z - epsilon)
  );
  return out.lengthSq() > 0 ? out.normalize() : out.set(0, 1, 0);
}
