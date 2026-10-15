import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

/** 両側の L 字ロック溝を貫通させた BNC カップリング。 */
export function bncBayonetGeometry() {
  const around = 128;
  const along = 32;
  const positions: number[] = [];
  const occupied = (column: number, row: number) => {
    if (row < 0 || row >= along) {
      return false;
    }
    const angle = ((column % around) + around) % around;
    const relative = angle % (around / 2);
    const entry = relative >= 12 && relative < 17 && row < 19;
    const lock = relative >= 12 && relative < 26 && row >= 14 && row < 19;
    return !entry && !lock;
  };
  const point = (column: number, row: number, inside: boolean) => {
    const angle = (column / around) * Math.PI * 2;
    const z = (row / along) * 8;
    const shoulder = Math.min(1, Math.max(0, (z - 1.5) / 0.6));
    const taper = Math.min(1, Math.max(0, (z - 7.2) / 0.8));
    const radius = inside ? 5.2 : 6.2 + shoulder * 0.7 - taper * 0.7;
    return new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
  };
  const quad = (a: Vector3, b: Vector3, c: Vector3, d: Vector3) => {
    for (const vertex of [a, b, c, a, c, d]) {
      positions.push(vertex.x, vertex.y, vertex.z);
    }
  };
  for (let column = 0; column < around; column += 1) {
    for (let row = 0; row < along; row += 1) {
      if (!occupied(column, row)) {
        continue;
      }
      const a = point(column, row, false);
      const b = point(column + 1, row, false);
      const c = point(column + 1, row + 1, false);
      const d = point(column, row + 1, false);
      const ai = point(column, row, true);
      const bi = point(column + 1, row, true);
      const ci = point(column + 1, row + 1, true);
      const di = point(column, row + 1, true);
      quad(a, b, c, d);
      quad(bi, ai, di, ci);
      if (!occupied(column, row - 1)) {
        quad(b, a, ai, bi);
      }
      if (!occupied(column, row + 1)) {
        quad(d, c, ci, di);
      }
      if (!occupied(column - 1, row)) {
        quad(a, d, di, ai);
      }
      if (!occupied(column + 1, row)) {
        quad(c, b, bi, ci);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  const smooth = toCreasedNormals(geometry, Math.PI / 5);
  if (smooth !== geometry) {
    geometry.dispose();
  }
  return smooth;
}
