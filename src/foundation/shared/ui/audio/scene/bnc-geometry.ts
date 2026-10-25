import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Shape,
  Vector3,
} from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

/** 両側の L 字ロック溝を貫通させた BNC カップリング。 */
export function bncBayonetGeometry() {
  const around = 256;
  // 直線の筒を等間隔に細分化せず、径とロック溝が変わる位置だけをつなぐ。
  const depths = [0, 0.6, 1.2, 3.75, 5.85, 7.2, 7.8, 12, 12.6];
  const along = depths.length - 1;
  const positions: number[] = [];
  const occupied = (column: number, row: number) => {
    const start = depths[row];
    const end = depths[row + 1];
    if (start === undefined || end === undefined) {
      return false;
    }
    const angle =
      (((column + 0.5) / around) * Math.PI * 2 + Math.PI * 2) % Math.PI;
    const relative = angle > Math.PI / 2 ? angle - Math.PI : angle;
    const z = (start + end) / 2;
    const entry = Math.abs(relative + Math.PI / 4) < 0.19 && z < 5.85;
    const lock =
      relative >= -Math.PI / 4 && relative < 0.2 && z >= 3.75 && z < 5.85;
    return !entry && !lock;
  };
  const point = (column: number, row: number, inside: boolean) => {
    const angle = (column / around) * Math.PI * 2;
    const z = depths[row];
    if (z === undefined) {
      throw new Error("Missing BNC coupling profile depth.");
    }
    let outer = 5.95;
    if (z < 0.6) {
      outer = 6.05 + z * 0.25;
    } else if (z < 1.2) {
      outer = 6.2 - (z - 0.6) * 0.42;
    } else if (z >= 7.2 && z < 7.8) {
      outer = 5.95 + (z - 7.2) * 1.58;
    } else if (z >= 7.8 && z <= 12) {
      outer = 6.9;
    } else if (z > 12) {
      outer = 6.9 - (z - 12) * 0.9;
    }
    const radius = inside ? 4.95 : outer;
    return new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
  };
  const quad = (a: Vector3, b: Vector3, c: Vector3, d: Vector3) => {
    for (const vertex of [a, b, c, a, c, d]) {
      positions.push(vertex.x, vertex.y, vertex.z);
    }
  };
  for (let column = 0; column < around; column += 1) {
    appendBayonetColumn(along, occupied, column, point, quad);
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

function appendBayonetColumn(
  along: number,
  occupied: (column: number, row: number) => boolean,
  column: number,
  point: (column: number, row: number, inside: boolean) => Vector3,
  quad: (a: Vector3, b: Vector3, c: Vector3, d: Vector3) => void
) {
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

/** Four spring leaves engage the inside of the jack barrel. */
export function bncGroundContactGeometry() {
  const leaves: Shape[] = [];
  for (let index = 0; index < 4; index += 1) {
    const start = (index * Math.PI) / 2 + 0.028;
    const end = ((index + 1) * Math.PI) / 2 - 0.028;
    const leaf = new Shape();
    leaf.absarc(0, 0, 4.07, start, end, false);
    leaf.absarc(0, 0, 3.5, end, start, true);
    leaf.closePath();
    leaves.push(leaf);
  }
  return new ExtrudeGeometry(leaves, {
    depth: 8.4,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    bevelSegments: 2,
    curveSegments: 32,
  });
}
