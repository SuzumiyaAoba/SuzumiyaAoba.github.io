import {
  ExtrudeGeometry,
  MeshStandardMaterial,
  Path,
  Shape,
  Vector2,
} from "three";
import type { Ha1aParts } from "./ha-1a-parts";
import { connectorShellGeometry } from "./connector-geometry";

const OUTLINE = [
  [-14, -9],
  [14, -9],
  [14, 5],
  [9, 10],
  [-9, 10],
  [-14, 5],
] as const;
const OPENING = [
  [-12.2, -7.5],
  [12.2, -7.5],
  [12.2, 4.2],
  [8.2, 8],
  [-8.2, 8],
  [-12.2, 4.2],
] as const;

export function createHa1aPowerInlet(parts: Ha1aParts) {
  const flange = new Shape(
    [
      [-14.5, 99],
      [14.5, 99],
      [23.5, 117.5],
      [14.5, 136],
      [-14.5, 136],
      [-23.5, 117.5],
    ].map(([x, y]) => new Vector2(x, y))
  );
  const opening = new Path(OPENING.map(([x, y]) => new Vector2(x, y + 123)));
  opening.closePath();
  flange.holes.push(opening);
  const drawer = new Path();
  drawer.moveTo(-12.3, 101);
  drawer.lineTo(-12.3, 110.3);
  drawer.lineTo(12.3, 110.3);
  drawer.lineTo(12.3, 101);
  drawer.closePath();
  flange.holes.push(drawer);
  for (const x of [-20.5, 20.5]) {
    const bore = new Path();
    bore.absarc(x, 117.5, 1.8, 0, Math.PI * 2, true);
    flange.holes.push(bore);
  }
  parts.mesh(
    new ExtrudeGeometry(flange, {
      depth: 2.2,
      bevelEnabled: true,
      bevelSize: 0.4,
      bevelThickness: 0.25,
      bevelSegments: 4,
    }),
    parts.black,
    [0, 0, 0.6],
    "Hexagonal IEC inlet flange with a separate fuse-drawer opening"
  );
  parts.mesh(
    connectorShellGeometry(OUTLINE, OPENING, 11, 0.16),
    parts.black,
    [0, 123, -7.7],
    "Recessed horizontal IEC C14 molded socket walls"
  );
  const floor = new Shape(OPENING.map(([x, y]) => new Vector2(x, y)));
  parts.mesh(
    new ExtrudeGeometry(floor, { depth: 0.05, bevelEnabled: false }),
    parts.black,
    [0, 123, -7.75],
    "HA-1A IEC socket cavity floor"
  );
  for (const [x, y] of [
    [-7, 120],
    [7, 120],
    [0, 126],
  ] as const) {
    parts.box(
      [1, 3.2, 7.7],
      [x, y, -3.1],
      parts.steel,
      "Recessed IEC C14 blade contact",
      0.13
    );
  }
  parts.facePlate(
    [23.8, 8.5, 3],
    [0, 105.65, 0.9],
    parts.charcoal,
    "Separate replaceable IEC fuse drawer",
    0.35
  );
  parts.box(
    [19, 0.6, 0.2],
    [0, 109.1, 2.51],
    parts.cavity,
    "Fuse drawer extraction notch",
    0.12
  );
  parts.screw([-20.5, 117.5, 2.5], "front", true).scale.set(1.25, 1.25, 1.5);
  parts.screw([20.5, 117.5, 2.5], "front", true).scale.set(1.25, 1.25, 1.5);
  const red = new MeshStandardMaterial({ color: 0x9f_18_1c, roughness: 0.52 });
  parts.box(
    [6, 15, 1.5],
    [-32, 123, 0.8],
    parts.rubber,
    "AC voltage selector housing",
    0.4
  );
  parts.box([4, 6, 1], [-32, 125.5, 1.9], red, "Red AC voltage selector", 0.1);
  parts.print(
    4,
    5,
    [-32, 125.5, 2.42],
    (context) => {
      context.fillStyle = "#c6c5ba";
      context.font = "1.35px Arial";
      context.textAlign = "center";
      context.fillText("115", 2, 2.9);
    },
    "Voltage-selector embossed marking",
    128
  );
}
