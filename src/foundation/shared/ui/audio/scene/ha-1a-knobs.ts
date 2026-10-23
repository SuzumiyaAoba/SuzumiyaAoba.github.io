import {
  BufferGeometry,
  Float32BufferAttribute,
  LatheGeometry,
  Vector2,
} from "three";
import type { Ha1aParts } from "./ha-1a-parts";
import { HA1A_FRONT } from "./ha-1a-geometry";

const NECK_DEPTH = 5.4;
const GRIP_START = 6.3;
const GRIP_LENGTH = 7.2;
const FACE_DEPTH = 14.1;

function taperedSkirtGeometry(radius: number) {
  const outerRadius = radius * 1.34;
  const neckRadius = radius * 0.86;
  const profile = [
    new Vector2(0, 0),
    new Vector2(outerRadius - 0.15, 0),
    new Vector2(outerRadius, 0.15),
    new Vector2(outerRadius, 0.65),
  ];
  const slopeStart = profile.length;
  for (let row = 0; row <= 48; row += 1) {
    const fraction = row / 48;
    profile.push(
      new Vector2(
        outerRadius - (outerRadius - neckRadius) * fraction,
        0.8 + 3.6 * fraction ** 0.85
      )
    );
  }
  const slopeEnd = profile.length;
  profile.push(new Vector2(neckRadius, 4.7), new Vector2(0, 4.7));
  const geometry = new LatheGeometry(profile, 256);
  const positions = geometry.getAttribute("position");
  // The indicator is cut into the sloping skirt itself.
  const indicatorRadius = radius * 1.08;
  for (let vertex = 0; vertex < positions.count; vertex += 1) {
    const row = vertex % profile.length;
    if (row < slopeStart || row >= slopeEnd) {
      continue;
    }
    const distance = Math.hypot(
      positions.getX(vertex),
      positions.getZ(vertex) + indicatorRadius
    );
    const depression = Math.max(0, 1 - (distance / 0.72) ** 2) ** 2 * 0.55;
    positions.setY(vertex, positions.getY(vertex) - depression);
  }
  geometry.rotateX(Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function diamondGripGeometry(radius: number) {
  const positions: number[] = [];
  const columns = 96;
  const rows = 16;
  const angularPitch = (Math.PI * 2) / columns;
  const halfHeight = GRIP_LENGTH / rows;
  const valleyRadius = radius - 0.06;
  const peakRadius = radius + 0.06;
  for (let row = 0; row <= rows; row += 1) {
    const z = row * halfHeight;
    for (let column = 0; column < columns; column += 1) {
      const angle = (column + (row % 2) * 0.5) * angularPitch;
      const corners = [
        [angle - angularPitch / 2, z],
        [angle, Math.max(0, z - halfHeight)],
        [angle + angularPitch / 2, z],
        [angle, Math.min(GRIP_LENGTH, z + halfHeight)],
      ] as const;
      for (let face = 0; face < corners.length; face += 1) {
        const first = corners[face];
        const second = corners[(face + 1) % corners.length];
        if (!first || !second) {
          continue;
        }
        positions.push(
          Math.cos(angle) * peakRadius,
          Math.sin(angle) * peakRadius,
          z,
          Math.cos(first[0]) * valleyRadius,
          Math.sin(first[0]) * valleyRadius,
          first[1],
          Math.cos(second[0]) * valleyRadius,
          Math.sin(second[0]) * valleyRadius,
          second[1]
        );
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createHa1aKnob(
  parts: Ha1aParts,
  x: number,
  y: number,
  radius: number,
  indexAngle: number,
  name: string
) {
  parts.cylinder(
    radius * 1.37,
    0.6,
    [x, y, HA1A_FRONT + 0.4],
    parts.rubber,
    `${name} thin mounting gasket`
  );
  const skirt = parts.mesh(
    taperedSkirtGeometry(radius),
    parts.turned,
    [x, y, HA1A_FRONT + 0.7],
    `${name} tapered skirt with shallow index dimple`
  );
  skirt.rotation.z = indexAngle - Math.PI / 2;
  parts.lathe(
    [
      [0, 0],
      [radius * 0.86, 0],
      [radius * 0.86, 0.45],
      [radius - 0.12, 0.9],
      [radius - 0.12, 8.1],
      [radius, 8.1],
      [radius, 8.55],
      [radius - 0.15, 8.7],
    ],
    [x, y, HA1A_FRONT + NECK_DEPTH],
    parts.turned,
    `${name} cylindrical grip and thin front chamfer`
  );
  parts.mesh(
    diamondGripGeometry(radius),
    parts.turned,
    [x, y, HA1A_FRONT + GRIP_START],
    `${name} diamond-cut knurled grip`
  );
  parts.disc(
    radius - 0.15,
    [x, y, HA1A_FRONT + FACE_DEPTH],
    parts.knobFace,
    `${name} flat radially machined face`
  );
}
