import {
  BufferGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  Vector3,
} from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

type GrilleOptions = {
  radiusX: number;
  radiusY: number;
  cellRadius: number;
  opening: number;
  depth: number;
  dome: number;
  z: number;
  graded?: boolean;
  mProfile?: boolean;
};

/** 円周を保ったまま格子のピッチを変え、左右で大きさの違う開口を作る。 */
function gradedPoint(x: number, y: number, radiusX: number, radiusY: number) {
  const u = x / radiusX;
  const v = y / radiusY;
  const shift = -0.19;
  const real = 1 + shift * u;
  const imaginary = shift * v;
  const divisor = real * real + imaginary * imaginary;
  return new Vector3(
    (((u + shift) * real + v * imaginary) / divisor) * radiusX,
    ((v * real - (u + shift) * imaginary) / divisor) * radiusY,
    0
  );
}

/** M 断面の中央ドーム、谷、外周ロールを滑らかにつなぐ。 */
export function clearMgDriverHeight(radius: number) {
  return (
    -1.65 * Math.exp(-((radius / 10) ** 2)) -
    1.5 * Math.exp(-(((radius - 17.4) / 2.7) ** 2))
  );
}

/** 一枚のパンチング板。外周とメダリオンの周囲にも連続した金属面を残す。 */
export function clearMgGrilleGeometry(options: GrilleOptions) {
  const { radiusX, radiusY, cellRadius, opening, depth, dome, z } = options;
  const outline = new Shape();
  outline.absellipse(0, 0, radiusX, radiusY, 0, Math.PI * 2, false, 0);
  if (opening > 0) {
    const center = new Path();
    center.absarc(0, 0, opening, 0, Math.PI * 2, true);
    outline.holes.push(center);
  }
  const columns = Math.ceil(radiusX / (cellRadius * 1.5)) + 3;
  const rows = Math.ceil(radiusY / (cellRadius * Math.sqrt(3))) + 2;
  for (let column = -columns; column <= columns; column += 1) {
    for (let row = -rows; row <= rows; row += 1) {
      const centerX = column * cellRadius * 1.5;
      const centerY = (row + (column % 2) * 0.5) * cellRadius * Math.sqrt(3);
      const points = Array.from({ length: 6 }, (_, corner) => {
        const angle = (-corner * Math.PI) / 3;
        const x = centerX + Math.cos(angle) * (cellRadius - 0.42);
        const y = centerY + Math.sin(angle) * (cellRadius - 0.42);
        return options.graded
          ? gradedPoint(x, y, radiusX, radiusY)
          : new Vector3(x, y, 0);
      });
      if (
        points.some(
          (point) =>
            (point.x / (radiusX - 0.7)) ** 2 +
              (point.y / (radiusY - 0.7)) ** 2 >
              1 ||
            (opening > 0 && Math.hypot(point.x, point.y) < opening + 0.7)
        )
      ) {
        continue;
      }
      const aperture = new Path();
      for (const [index, point] of points.entries()) {
        const previous = points[(index + 5) % 6] ?? point;
        const next = points[(index + 1) % 6] ?? point;
        const before = point.clone().lerp(previous, 0.07);
        const after = point.clone().lerp(next, 0.07);
        if (index === 0) {
          aperture.moveTo(before.x, before.y);
        } else {
          aperture.lineTo(before.x, before.y);
        }
        const middle = before
          .clone()
          .addScaledVector(point, 2)
          .add(after)
          .multiplyScalar(0.25);
        aperture.lineTo(middle.x, middle.y);
        aperture.lineTo(after.x, after.y);
      }
      aperture.closePath();
      outline.holes.push(aperture);
    }
  }
  const geometry = new ExtrudeGeometry(outline, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.055,
    bevelThickness: 0.055,
    bevelSegments: 2,
    curveSegments: 64,
  });
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");
  const faceNormals = geometry.getAttribute("normal").clone();
  toCreasedNormals(geometry, Math.PI / 4);
  const normals = geometry.getAttribute("normal");
  const heightAt = (x: number, y: number) =>
    options.mProfile
      ? clearMgDriverHeight(Math.hypot(x, y))
      : dome * Math.max(0, 1 - (x / radiusX) ** 2 - (y / radiusY) ** 2);
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const bulge = heightAt(x, y);
    positions.setZ(index, positions.getZ(index) - depth + bulge + z);
    uvs.setXY(index, x / (radiusX * 2) + 0.5, y / (radiusY * 2) + 0.5);
    const normal = new Vector3().fromBufferAttribute(normals, index);
    if (Math.abs(faceNormals.getZ(index)) === 1) {
      normal.set(0, 0, faceNormals.getZ(index));
    }
    const dx = (heightAt(x + 0.005, y) - heightAt(x - 0.005, y)) / 0.01;
    const dy = (heightAt(x, y + 0.005) - heightAt(x, y - 0.005)) / 0.01;
    normal
      .set(normal.x - dx * normal.z, normal.y - dy * normal.z, normal.z)
      .normalize();
    normals.setXYZ(index, normal.x, normal.y, normal.z);
  }
  // 変形後の解析法線を汎用の押し出し処理で上書きしない。
  const curved = new BufferGeometry().copy(geometry);
  geometry.dispose();
  return curved;
}

export const clearMgBandStart = 0.085 * Math.PI;
export const clearMgBandEnd = 0.915 * Math.PI;
export const clearMgBandSeam = 2.35;

export function clearMgBandPoint(u: number, v: number) {
  const angle = clearMgBandStart + u * (clearMgBandEnd - clearMgBandStart);
  const end =
    Math.exp(-((u / 0.035) ** 2)) + Math.exp(-(((1 - u) / 0.035) ** 2));
  const radial =
    (8 - 1.8 * end) * Math.sign(Math.cos(v)) * Math.abs(Math.cos(v)) ** 0.72;
  return new Vector3(
    (89 + radial) * Math.cos(angle),
    135 + (85 + radial) * Math.sin(angle),
    (18.5 - end) * Math.sign(Math.sin(v)) * Math.abs(Math.sin(v)) ** 0.72
  );
}

function sleeveOutline(width: number, height: number, radius: number) {
  const shape = new Shape();
  shape.moveTo(-width / 2 + radius, -height / 2);
  shape.lineTo(width / 2 - radius, -height / 2);
  shape.quadraticCurveTo(
    width / 2,
    -height / 2,
    width / 2,
    -height / 2 + radius
  );
  shape.lineTo(width / 2, height / 2 - radius);
  shape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2);
  shape.lineTo(-width / 2 + radius, height / 2);
  shape.quadraticCurveTo(
    -width / 2,
    height / 2,
    -width / 2,
    height / 2 - radius
  );
  shape.lineTo(-width / 2, -height / 2 + radius);
  shape.quadraticCurveTo(
    -width / 2,
    -height / 2,
    -width / 2 + radius,
    -height / 2
  );
  return shape;
}

export function clearMgSleeveGeometry(depth: number) {
  const shape = sleeveOutline(35, 13, 3.5);
  shape.holes.push(
    new Path(sleeveOutline(28, 11, 1).getPoints(16).toReversed())
  );
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSize: 0.12,
    bevelThickness: 0.12,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.rotateY(Math.PI / 2);
  geometry.translate(0, depth / 2, 0);
  return geometry;
}

export function clearMgBandGeometry(start: number, end: number) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const segments = 160;
  const sections = 48;
  for (let column = 0; column <= segments; column += 1) {
    for (let row = 0; row <= sections; row += 1) {
      const u = column / segments;
      const v = row / sections;
      const point = clearMgBandPoint(u, start + v * (end - start));
      positions.push(point.x, point.y, point.z);
      uvs.push(u, v);
      if (column < segments && row < sections) {
        const current = column * (sections + 1) + row;
        const next = current + sections + 1;
        indices.push(current, next, current + 1, next, next + 1, current + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function clearMgBandPerforations() {
  const rows = [2.47, 2.68, 2.91, Math.PI, 3.37, 3.6, 3.81];
  const span = Math.PI * 2 - clearMgBandSeam * 2;
  return rows.flatMap((angle, row) =>
    Array.from({ length: 62 }, (_, column) => {
      const u = 0.025 + ((column + (row % 2) * 0.5) / 62) * 0.95;
      const position = clearMgBandPoint(u, angle);
      const tangent = clearMgBandPoint(u + 0.0001, angle)
        .sub(position)
        .divideScalar(0.0001);
      const bitangent = clearMgBandPoint(u, angle + 0.0001)
        .sub(position)
        .divideScalar(0.0001);
      return {
        u: u * Math.PI * 2,
        v: ((angle - clearMgBandSeam) / span) * Math.PI * 2,
        position,
        normal: new Vector3().crossVectors(tangent, bitangent).normalize(),
        radiusU: (0.43 / tangent.length()) * Math.PI * 2,
        radiusV: (0.43 / bitangent.length() / span) * Math.PI * 2,
      };
    })
  );
}

/** 20 mm 厚のクッション。角を落とした断面に、縫い目の軽い絞りを加える。 */
export function padPoint(u: number, v: number) {
  const radial = Math.sign(Math.cos(v)) * Math.abs(Math.cos(v)) ** 0.72;
  const depth = Math.sign(Math.sin(v)) * Math.abs(Math.sin(v)) ** 0.72;
  const seam = 0.22 * Math.exp(-(((v - 0.44) / 0.12) ** 2));
  return new Vector3(
    (35 + (11 - seam) * radial) * Math.cos(u),
    (46 + (11 - seam) * radial) * Math.sin(u),
    -18 + 10 * depth
  );
}

const perforationRows = [
  -2.85, -2.55, -2.2, -1.85, -1.4, -1.05, -0.7, -0.35, 0.1, 0.5, 2.8,
];
const perforationColumns = 80;
const perforationRadius = 0.43;

export function clearMgPadPerforations() {
  return perforationRows.flatMap((v, row) =>
    Array.from({ length: perforationColumns }, (_, column) => {
      const u = ((column + (row % 2) * 0.5) / perforationColumns) * Math.PI * 2;
      const position = padPoint(u, v);
      const tangent = padPoint(u + 0.001, v)
        .sub(position)
        .divideScalar(0.001);
      const bitangent = padPoint(u, v + 0.001)
        .sub(position)
        .divideScalar(0.001);
      return {
        u,
        v: (v + Math.PI * 2) % (Math.PI * 2),
        position,
        normal: new Vector3().crossVectors(tangent, bitangent).normalize(),
        radiusU: perforationRadius / tangent.length(),
        radiusV: perforationRadius / bitangent.length(),
      };
    })
  );
}
