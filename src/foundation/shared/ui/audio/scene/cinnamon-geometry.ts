import {
  BufferGeometry,
  BoxGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  MathUtils,
  Path,
  Shape,
  Vector2,
  Vector3,
  SphereGeometry,
} from "three";

import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type CinnamonConnector = "usb-a" | "usb-b";

/** USB-A の長方形と USB-B の面取り形状を、中空の金属シェルにする。 */
export function cinnamonShieldGeometry(type: CinnamonConnector) {
  if (type === "usb-a") {
    return cinnamonUsbAShield();
  }
  // USB 2.0 Series B: 8 × 7.25 mm, 0.3 mm folded sheet.
  // The tiny opening along the bottom is the actual folded-sheet seam.
  const profile = [
    [-0.025, -3.625],
    [-4, -3.625],
    [-4, 1.975],
    [-2.35, 3.625],
    [2.35, 3.625],
    [4, 1.975],
    [4, -3.625],
    [0.025, -3.625],
    [0.025, -3.325],
    [3.7, -3.325],
    [3.7, 1.85],
    [2.225, 3.325],
    [-2.225, 3.325],
    [-3.7, 1.85],
    [-3.7, -3.325],
    [-0.025, -3.325],
  ];
  const shape = new Shape(profile.map(([x, y]) => new Vector2(x, y)));
  return new ExtrudeGeometry(shape, {
    depth: 12,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    bevelSegments: 2,
  });
}

/** USB-A の保持ばねが掛かる上下二組の開口も板厚を持つ。 */
function cinnamonUsbAShield() {
  const pieces: BufferGeometry[] = [];
  for (const side of [-1, 1]) {
    const plate = new Shape();
    plate.moveTo(-6, -12);
    plate.lineTo(6, -12);
    plate.lineTo(6, 0);
    plate.lineTo(-6, 0);
    plate.closePath();
    for (const x of [-2.6, 2.6]) {
      const hole = new Path();
      hole.moveTo(x - 1, -6.8);
      hole.lineTo(x - 1, -4.8);
      hole.lineTo(x + 1, -4.8);
      hole.lineTo(x + 1, -6.8);
      hole.closePath();
      plate.holes.push(hole);
    }
    const stamp = new Path();
    stamp.absellipse(0, -9.4, 0.75, 0.28, 0, Math.PI * 2, true, 0);
    plate.holes.push(stamp);
    const depression = new SphereGeometry(
      1,
      24,
      12,
      0,
      Math.PI * 2,
      Math.PI / 2,
      Math.PI / 2
    ).toNonIndexed();
    depression.scale(0.75, 0.16, 0.28);
    const depressionNormals = depression.getAttribute("normal");
    for (let index = 0; index < depressionNormals.count; index += 1) {
      depressionNormals.setXYZ(
        index,
        -depressionNormals.getX(index),
        -depressionNormals.getY(index),
        -depressionNormals.getZ(index)
      );
    }
    // The inside of the lower hemisphere is the shallow stamped depression.
    const attributes = Object.values(depression.attributes);
    for (
      let index = 0;
      index < depression.getAttribute("position").count;
      index += 3
    ) {
      for (const attribute of attributes) {
        for (
          let component = 0;
          component < attribute.itemSize;
          component += 1
        ) {
          const value = attribute.getComponent(index + 1, component);
          attribute.setComponent(
            index + 1,
            component,
            attribute.getComponent(index + 2, component)
          );
          attribute.setComponent(index + 2, component, value);
        }
      }
    }
    if (side < 0) {
      depression.rotateZ(Math.PI);
    }
    depression.translate(0, side * 2.25, 9.4);
    pieces.push(depression);
    const face = new ExtrudeGeometry(plate, {
      depth: 0.3,
      bevelEnabled: false,
    });
    face.rotateX(-Math.PI / 2);
    if (side < 0) {
      face.rotateZ(Math.PI);
    }
    face.translate(0, side * 1.95, 0);
    pieces.push(face);
    const edge = new BoxGeometry(0.3, 3.9, 12).toNonIndexed();
    edge.translate(side * 5.85, 0, 6);
    pieces.push(edge);
  }
  const geometry = mergeGeometries(pieces);
  for (const piece of pieces) {
    piece.dispose();
  }
  return geometry;
}

export const cinnamonShoulder = 12;
export const cinnamonTail = 40;

function housingSection(type: CinnamonConnector, z: number) {
  const taper = MathUtils.smoothstep(z, 20, cinnamonTail);
  const roll =
    0.94 + 0.06 * Math.sin((Math.min(1, (z - 12) / 0.7) * Math.PI) / 2);
  return {
    width: MathUtils.lerp(type === "usb-a" ? 8 : 5.6, 3.1, taper) * roll,
    height: MathUtils.lerp(type === "usb-a" ? 4.4 : 6, 3.1, taper) * roll,
    power: MathUtils.lerp(0.35, 1, taper),
  };
}

function housingPoint(type: CinnamonConnector, angle: number, z: number) {
  const { width, height, power } = housingSection(type, z);
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return new Vector3(
    Math.sign(cosine) * Math.abs(cosine) ** power * width,
    Math.sign(sine) * Math.abs(sine) ** power * height,
    z
  );
}

/** The rounded shoulder, red/black join and round cable outlet share one surface. */
export function cinnamonHousingGeometry(
  type: CinnamonConnector,
  section: "cover" | "boot"
) {
  const around = 128;
  const along = 48;
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= along; row += 1) {
    for (let column = 0; column <= around; column += 1) {
      const angle = (column / around) * Math.PI * 2;
      const seam = 26 + 6 * Math.abs(Math.sin(angle)) ** 4;
      const z =
        section === "cover"
          ? MathUtils.lerp(cinnamonShoulder, seam, row / along)
          : MathUtils.lerp(seam, cinnamonTail, row / along);
      const point = housingPoint(type, angle, z);
      const tangent = housingPoint(type, angle + 0.0001, z).sub(
        housingPoint(type, angle - 0.0001, z)
      );
      const axial = housingPoint(
        type,
        angle,
        Math.min(cinnamonTail, z + 0.0001)
      ).sub(housingPoint(type, angle, Math.max(cinnamonShoulder, z - 0.0001)));
      const normal = tangent.cross(axial).normalize();
      positions.push(...point.toArray());
      normals.push(...normal.toArray());
      if (row < along && column < around) {
        const first = row * (around + 1) + column;
        const next = first + around + 1;
        indices.push(first, first + 1, next, first + 1, next + 1, next);
      }
    }
  }
  // Separate vertices keep the shoulder planar without smoothing triangle fans.
  const z = section === "cover" ? cinnamonShoulder : cinnamonTail;
  const firstCap = positions.length / 3;
  positions.push(0, 0, z);
  normals.push(0, 0, section === "cover" ? -1 : 1);
  for (let column = 0; column <= around; column += 1) {
    positions.push(
      ...housingPoint(type, (column / around) * Math.PI * 2, z).toArray()
    );
    normals.push(0, 0, section === "cover" ? -1 : 1);
    if (column < around) {
      const next = firstCap + column + 1;
      indices.push(
        ...(section === "cover"
          ? [firstCap, next + 1, next]
          : [firstCap, next, next + 1])
      );
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

/** 印字を湾曲した赤い塗装面へ密着させる。 */
export function cinnamonMarkGeometry(type: CinnamonConnector) {
  const width = type === "usb-a" ? 11.5 : 8;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const segments = 32;
  for (let row = 0; row <= segments; row += 1) {
    for (let column = 0; column <= segments; column += 1) {
      const x = (column / segments - 0.5) * width;
      const z = 14 + (row / segments) * 14;
      const section = housingSection(type, z);
      const y =
        section.height *
        (1 - Math.abs(x / section.width) ** (2 / section.power)) **
          (section.power / 2);
      positions.push(x, y + 0.014, z);
      uvs.push(column / segments, 1 - row / segments);
      if (row < segments && column < segments) {
        const first = row * (segments + 1) + column;
        const next = first + segments + 1;
        indices.push(first, next, first + 1, first + 1, next, next + 1);
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
