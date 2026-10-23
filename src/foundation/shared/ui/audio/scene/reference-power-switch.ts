import {
  BufferGeometry,
  Float32BufferAttribute,
  MeshPhysicalMaterial,
  Path,
  SphereGeometry,
} from "three";
import type { ModelParts } from "./parts";

const SWITCH_X = -114;
const SWITCH_Y = 39;
const FRONT = 115;
const ARC_SEGMENTS = 32;
const LEVER_ANGLE = Math.PI / 18;
const LEVER_LENGTH = 8.2;

export function referencePowerSwitchCutout(): Path {
  const hole = new Path();
  hole.moveTo(SWITCH_X - 6, SWITCH_Y - 4);
  hole.lineTo(SWITCH_X - 6, SWITCH_Y + 4);
  hole.absarc(SWITCH_X, SWITCH_Y + 4, 6, Math.PI, 0, true);
  hole.lineTo(SWITCH_X + 6, SWITCH_Y - 4);
  hole.absarc(SWITCH_X, SWITCH_Y - 4, 6, 0, Math.PI, true);
  hole.closePath();
  return hole;
}

function bezelGeometry(): BufferGeometry {
  // Loft capsule contours into the rounded, countersunk surround; the centre stays open.
  const contours = [
    [5.95, 4, -3.2],
    [5.95, 4, -0.45],
    [5.85, 4, -0.08],
    [5.6, 4, 0.04],
    [5.2, 4, -0.06],
    [4.6, 3.85, -0.35],
    [3.8, 3.65, -1.1],
    [3.15, 3.5, -2.1],
    [3.05, 3.5, -2.65],
    [3.05, 3.5, -3.2],
  ] as const;
  const positions: number[] = [];
  const indices: number[] = [];
  const contourSize = (ARC_SEGMENTS + 1) * 2;
  for (const [radius, halfStraight, depth] of contours) {
    for (const half of [0, 1]) {
      for (let segment = 0; segment <= ARC_SEGMENTS; segment += 1) {
        const angle = (half + segment / ARC_SEGMENTS) * Math.PI;
        positions.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius +
            (half === 0 ? halfStraight : -halfStraight),
          depth
        );
      }
    }
  }
  for (let contour = 0; contour < contours.length - 1; contour += 1) {
    for (let point = 0; point < contourSize; point += 1) {
      const next = (point + 1) % contourSize;
      const a = contour * contourSize + point;
      const b = contour * contourSize + next;
      const c = (contour + 1) * contourSize + point;
      const d = (contour + 1) * contourSize + next;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createReferencePowerSwitch(
  parts: ModelParts,
  model: "UD-505" | "CG-10M"
) {
  const satin = new MeshPhysicalMaterial({
    color: 0xa0_a3_a6,
    metalness: 0.85,
    roughness: 0.42,
    envMapIntensity: 1,
  });
  parts.mesh(
    bezelGeometry(),
    satin,
    [SWITCH_X, SWITCH_Y, FRONT],
    `${model} countersunk capsule power-switch bezel`
  );
  parts.facePlate(
    [6.1, 13.1, 0.4],
    [SWITCH_X, SWITCH_Y, FRONT - 3.3],
    parts.cavity,
    `${model} recessed power-switch cavity`,
    3.05
  );

  const pivotY = 42;
  const pivotZ = FRONT - 1.4;
  parts.mesh(
    new SphereGeometry(2.65, 48, 24),
    parts.steel,
    [SWITCH_X, pivotY, pivotZ],
    `${model} power-toggle ball pivot`
  );
  const lever = parts.lathe(
    [
      [0, -0.8],
      [1.85, -0.8],
      [1.85, 0.2],
      [2.15, 0.8],
      [2.3, 1.4],
      [2.3, 7.6],
      [2.27, 7.95],
      [2.15, LEVER_LENGTH],
      [0, LEVER_LENGTH],
    ],
    [SWITCH_X, pivotY, pivotZ],
    parts.turned,
    `${model} power-toggle lever in ON position`
  );
  lever.rotation.x = Math.PI / 2 - LEVER_ANGLE;

  const tip = LEVER_LENGTH + 0.015;
  const face = parts.disc(
    2.15,
    [
      SWITCH_X,
      pivotY + Math.sin(LEVER_ANGLE) * tip,
      pivotZ + Math.cos(LEVER_ANGLE) * tip,
    ],
    parts.turnedFace(),
    `${model} concentric machined power-toggle end face`
  );
  face.rotation.x = -LEVER_ANGLE;
}
