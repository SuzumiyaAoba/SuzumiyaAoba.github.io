import { BoxGeometry, Matrix4, MeshPhysicalMaterial } from "three";
import type { ModelParts } from "./parts";

const FRONT = 115;

// 外周は前板と面一。面取りの奥に黒い絶縁体と接点を置く。
export const ud505CircularCutouts = [
  [0, 27, 8.45],
  [25.5, 30.8, 5.55],
  [50.7, 27, 8.45],
  [-90, 31, 5.55],
  [-50.5, 43, 13.1],
  [99.5, 43.5, 22.1],
  [-24, 55, 4.7],
  [-24, 30.8, 4],
] as const;

function countersink(
  parts: ModelParts,
  x: number,
  y: number,
  outer: number,
  inner: number,
  depth: number
) {
  const satin = new MeshPhysicalMaterial({
    color: 0xb9_bc_be,
    metalness: 0.65,
    roughness: 0.5,
  });
  parts.lathe(
    [
      [outer, -3.5],
      [outer, -0.35],
      [outer - 0.1, -0.03],
      [outer - 0.45, 0],
      [outer - 0.85, -0.12],
      [inner + 0.55, -depth + 0.25],
      [inner, -depth],
      [inner, -3.5],
    ],
    [x, y, FRONT],
    satin,
    "Recessed machined control surround, flush with the front plate"
  );
}

function headphoneSocket(
  parts: ModelParts,
  x: number,
  y: number,
  bore: number,
  small = false
) {
  const outer = small ? 5.55 : 8.45;
  const sleeve = small ? 3 : 4.7;
  const depth = small ? 1.8 : 2.5;
  countersink(parts, x, y, outer, sleeve + 0.45, depth);
  parts.lathe(
    [
      [sleeve + 0.5, -8],
      [sleeve + 0.5, -depth],
      [sleeve + 0.18, -depth + 0.12],
      [sleeve, -depth],
      [sleeve, -8],
    ],
    [x, y, FRONT],
    parts.black,
    "Headphone socket annular insulating collar"
  );
  parts.lathe(
    [
      [sleeve, -8],
      [sleeve, -depth],
      [sleeve - 0.15, -depth + 0.2],
      [bore + 0.3, -depth + 0.2],
      [bore, -depth - 0.2],
      [bore, -12.5],
    ],
    [x, y, FRONT],
    parts.gold,
    small
      ? "Pentaconn 4.4 mm hollow gold sleeve"
      : "6.3 mm hollow gold headphone sleeve"
  );
  parts.disc(
    bore,
    [x, y, FRONT - 12.6],
    parts.cavity,
    "Deep headphone socket floor"
  );
  for (const z of [-5.5, -9.5]) {
    const spring = parts.box(
      [0.32, bore * 0.75, 2.8],
      [x + bore - 0.18, y, FRONT + z],
      parts.gold,
      "Recessed headphone spring contact",
      0.08
    );
    spring.rotation.y = -0.08;
  }
}

function knob(parts: ModelParts, x: number, y: number, small: boolean) {
  const radius = small ? 10 : 18.3;
  const faceRadius = small ? 8.5 : 16.25;
  const depth = small ? 11.5 : 15.7;
  countersink(parts, x, y, small ? 13.1 : 22.1, radius + 0.75, 1.5);
  parts.cylinder(
    radius + 0.8,
    0.5,
    [x, y, FRONT - 1.8],
    parts.cavity,
    "Dial clearance at the bottom of the countersink"
  );
  parts.lathe(
    [
      [0, -1.7],
      [radius - 0.5, -1.7],
      [radius, -1.2],
      [radius, 1],
      [radius - 0.1, 2],
      [faceRadius + 0.6, depth - 2.1],
      [faceRadius + 0.3, depth - 0.6],
      [faceRadius, depth],
    ],
    [x, y, FRONT],
    parts.turned,
    small
      ? "Input selector with a tapered machined rim"
      : "Volume control with a tapered machined rim"
  );
  const face = parts.turnedFace().clone();
  face.color.setHex(0xcb_cd_d0);
  face.roughness = 0.37;
  face.anisotropy = 0.6;
  parts.disc(
    faceRadius,
    [x, y, FRONT + depth],
    face,
    "Concentric turned aluminium dial face"
  );
  if (!small) {
    return;
  }
  const count = 144;
  const grips = parts.instanced(
    new BoxGeometry(0.065, 0.1, 1.5),
    parts.turned,
    count,
    "Fine axial input-selector knurling"
  );
  const matrix = new Matrix4();
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    const gripRadius = faceRadius + 0.7;
    matrix.makeRotationZ(angle);
    matrix.setPosition(
      x + Math.cos(angle) * gripRadius,
      y + Math.sin(angle) * gripRadius,
      FRONT + depth - 2.5
    );
    grips.setMatrixAt(index, matrix);
  }
}

export function createUd505Controls(parts: ModelParts) {
  headphoneSocket(parts, 0, 27, 3.15);
  headphoneSocket(parts, 25.5, 30.8, 2.2, true);
  headphoneSocket(parts, 50.7, 27, 3.15);
  knob(parts, -50.5, 43, true);
  knob(parts, 99.5, 43.5, false);
  countersink(parts, -90, 31, 5.55, 3.2, 1.7);
  parts.lathe(
    [
      [3.2, -1.6],
      [2, -1.6],
      [1.75, -2],
      [1.75, -9],
    ],
    [-90, 31, FRONT],
    parts.black,
    "Combined optical / coaxial input insulating sleeve"
  );
  parts.disc(
    1.76,
    [-90, 31, FRONT - 9.1],
    parts.cavity,
    "Recessed optical / coaxial input cavity"
  );
  parts.box(
    [0.25, 1, 2],
    [-88.35, 31, FRONT - 5.2],
    parts.steel,
    "Mini-jack coaxial contact",
    0.05
  );
  countersink(parts, -24, 55, 4.7, 3.55, 0.7);
  parts.cylinder(
    3.55,
    0.4,
    [-24, 55, FRONT - 0.9],
    parts.cavity,
    "Menu-button clearance"
  );
  parts.cylinder(
    3.2,
    0.9,
    [-24, 55, FRONT - 0.15],
    parts.turned,
    "Menu button"
  );
  parts.disc(
    3.15,
    [-24, 55, FRONT + 0.31],
    parts.turnedFace(),
    "Radially machined menu-button face"
  );
  parts.lathe(
    [
      [4, -2],
      [4, 0],
      [3.85, 0.06],
      [3.7, -0.2],
      [3.7, -2],
    ],
    [-24, 30.8, FRONT],
    parts.black,
    "Flush infrared-receiver rim"
  );
  const receiver = parts.glass.clone();
  receiver.color.setHex(0x4b_49_54);
  receiver.roughness = 0.17;
  parts.disc(
    3.72,
    [-24, 30.8, FRONT - 0.3],
    receiver,
    "Smoked infrared receiver window"
  );
}
