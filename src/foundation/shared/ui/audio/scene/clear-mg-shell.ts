import {
  BufferGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  ShapeGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const outerX = 47;
const outerY = 58;
const openingHalfWidth = 6;

/** 楕円シェルの側壁にも端子穴を開け、ジャックの内側を筐体で塞がない。 */
export function clearMgShellGeometry() {
  const profile = [
    [0, -5],
    [0, 4.4],
    [0.35, 5.25],
    [1.2, 5.6],
    [3.3, 5.6],
    [4.15, 5.25],
    [4.5, 4.4],
    [4.5, -5],
    [4.15, -5.85],
    [3.3, -6.2],
    [1.2, -6.2],
    [0.35, -5.85],
  ] as const;
  const positions: number[] = [];
  const indices: number[] = [];
  const sections = profile.length;
  const segments = 256;
  const cut = Math.asin(openingHalfWidth / outerX);
  for (let column = 0; column <= segments; column += 1) {
    const angle = cut + (column / segments) * (Math.PI * 2 - cut * 2);
    for (const [inset, z] of profile) {
      positions.push(
        (outerX - inset) * Math.sin(angle),
        -(outerY - inset) * Math.cos(angle),
        z
      );
    }
    if (column < segments) {
      for (let row = 0; row < sections; row += 1) {
        const current = column * sections + row;
        const next = current + sections;
        const after = column * sections + ((row + 1) % sections);
        indices.push(current, next, after, next, after + sections, after);
      }
    }
  }
  // 開口の左右を除く丸いリムは、前後の面取りごと底までつなぐ。
  for (let column = 0; column < 24; column += 1) {
    const first = -cut + (column / 24) * cut * 2;
    const second = -cut + ((column + 1) / 24) * cut * 2;
    for (let row = 0; row < sections; row += 1) {
      if (row === 0 || row === 6) {
        continue;
      }
      const next = (row + 1) % sections;
      const offset = positions.length / 3;
      for (const [angle, section] of [
        [first, row],
        [second, row],
        [first, next],
        [second, next],
      ] as const) {
        const [inset, z] = profile[section] ?? profile[0];
        positions.push(
          (outerX - inset) * Math.sin(angle),
          -(outerY - inset) * Math.cos(angle),
          z
        );
      }
      indices.push(
        offset,
        offset + 1,
        offset + 2,
        offset + 1,
        offset + 3,
        offset + 2
      );
    }
  }
  const frame = new BufferGeometry();
  frame.setAttribute("position", new Float32BufferAttribute(positions, 3));
  frame.setIndex(indices);
  frame.computeVertexNormals();
  const walls = [0, 4.5].map((inset) => {
    const radiusX = outerX - inset;
    const radiusY = outerY - inset;
    const halfWidth = radiusX * Math.sin(cut);
    const shape = new Shape();
    shape.moveTo(-halfWidth, -5);
    shape.lineTo(halfWidth, -5);
    shape.lineTo(halfWidth, 4.4);
    shape.lineTo(-halfWidth, 4.4);
    shape.closePath();
    const hole = new Path();
    hole.absarc(0, -0.5, 4.15, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const wall = new ShapeGeometry(shape, 48);
    const vertices = wall.getAttribute("position");
    const normals = wall.getAttribute("normal");
    wall.deleteAttribute("uv");
    for (let index = 0; index < vertices.count; index += 1) {
      const x = vertices.getX(index);
      const z = vertices.getY(index);
      const y = -radiusY * Math.sqrt(1 - (x / radiusX) ** 2);
      const nx = x / radiusX ** 2;
      const ny = y / radiusY ** 2;
      const length = Math.hypot(nx, ny) * (inset ? -1 : 1);
      vertices.setXYZ(index, x, y, z);
      normals.setXYZ(index, nx / length, ny / length, 0);
    }
    if (inset) {
      const index = wall.getIndex();
      if (index) {
        for (let triangle = 0; triangle < index.count; triangle += 3) {
          const second = index.getX(triangle + 1);
          index.setX(triangle + 1, index.getX(triangle + 2));
          index.setX(triangle + 2, second);
        }
      }
    }
    return wall;
  });
  const geometry = mergeGeometries([frame, ...walls]);
  for (const part of [frame, ...walls]) {
    part.dispose();
  }
  return geometry;
}
