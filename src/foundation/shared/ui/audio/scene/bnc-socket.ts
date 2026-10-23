import {
  ExtrudeGeometry,
  MeshStandardMaterial,
  RingGeometry,
  Shape,
} from "three";
import type { ModelParts, Position } from "./parts";

export function bncContactGeometry() {
  const leaves = [0, Math.PI].map((rotation) => {
    const leaf = new Shape();
    const start = rotation + 0.075;
    const end = rotation + Math.PI - 0.075;
    leaf.absarc(0, 0, 1.02, start, end, false);
    leaf.absarc(0, 0, 0.66, end, start, true);
    leaf.closePath();
    return leaf;
  });
  return new ExtrudeGeometry(leaves, {
    depth: 1,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    bevelSegments: 3,
    curveSegments: 32,
  });
}

/** 50 Ω BNC メス端子。絶縁体と二分割のばね接点を実際に中空にする。 */
export function createBncSocket(
  parts: ModelParts,
  [x, y, z]: Position,
  hexNut = false
) {
  const dielectric = new MeshStandardMaterial({
    color: 0xe5_dc_c9,
    roughness: 0.83,
  });
  parts.cylinder(
    6.5,
    1.1,
    [x, y, z + 1.15],
    parts.gold,
    "BNC panel mounting flange",
    hexNut ? 6 : 64
  );
  parts.lathe(
    [
      [4.825, 0],
      [4.825, 8.05],
      [4.75, 8.3],
      [4.6, 8.4],
      [4.14, 8.4],
      [4.065, 8.25],
      [4.065, 0],
    ],
    [x, y, z + 1.7],
    parts.gold,
    "Gold-plated BNC barrel with a rolled mating lip"
  );
  parts.lathe(
    [
      [2.35, 2],
      [2.35, 6.98],
    ],
    [x, y, z],
    dielectric,
    "BNC annular PTFE dielectric with an open centre"
  );
  parts.lathe(
    [
      [1.05, 6.98],
      [1.05, 2],
    ],
    [x, y, z],
    dielectric,
    "Inner wall of the BNC dielectric bore"
  );
  parts.mesh(
    new RingGeometry(1.05, 2.35, 64),
    dielectric,
    [x, y, z + 6.98],
    "Flat PTFE face inside the BNC barrel"
  );
  parts.lathe(
    [
      [1.02, 2.8],
      [1.02, 5.8],
      [0.66, 5.8],
      [0.66, 2.8],
    ],
    [x, y, z],
    parts.gold,
    "Deep gold BNC centre-contact sleeve"
  );
  parts.mesh(
    bncContactGeometry(),
    parts.gold,
    [x, y, z + 5.8],
    "Two separated BNC female spring-contact leaves"
  );
  parts.disc(
    0.67,
    [x, y, z + 2.7],
    parts.cavity,
    "BNC centre-contact bore floor"
  );
  for (const side of [-1, 1]) {
    const pin = parts.cylinder(
      1.07,
      0.7,
      [x + side * 5.175, y, z + 6.65],
      parts.gold,
      "Cylindrical BNC bayonet locking pin",
      32
    );
    pin.rotation.set(0, 0, Math.PI / 2);
  }
}
