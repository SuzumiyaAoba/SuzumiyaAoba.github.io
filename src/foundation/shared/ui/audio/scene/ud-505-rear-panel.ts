import { ExtrudeGeometry, Path, Shape } from "three";
import { usbBOutline } from "./connector-geometry";
import type { ModelParts } from "./parts";
import { powerInletOpening } from "./reference-power-inlet";

export const serviceUsbOutline = [
  [-4, -0.6],
  [-3, -1.5],
  [3, -1.5],
  [4, -0.6],
  [4, 1],
  [-4, 1],
] as const;
export const serviceUsbOpening = [
  [-3.6, -0.5],
  [-2.8, -1.1],
  [2.8, -1.1],
  [3.6, -0.5],
  [3.6, 0.6],
  [-3.6, 0.6],
] as const;

export function createUd505RearPanel(parts: ModelParts) {
  const panel = new Shape();
  panel.moveTo(-137, 13);
  panel.lineTo(137, 13);
  panel.lineTo(137, 69);
  panel.lineTo(-137, 69);
  panel.closePath();
  for (const [x, y, radius] of [
    [-105, 32, 8.3],
    [-21.5, 32, 8.3],
  ] as const) {
    const hole = new Path();
    hole.absarc(x, y, radius, 0, Math.PI * 2, true);
    panel.holes.push(hole);
  }
  for (const [x, y, outline] of [
    [25.5, 54, usbBOutline],
    [47, 25, serviceUsbOpening],
    [110, 42, powerInletOpening],
  ] as const) {
    const hole = new Path();
    for (const [index, [dx, dy]] of outline.entries()) {
      if (index === 0) {
        hole.moveTo(x + dx, y + dy);
      } else {
        hole.lineTo(x + dx, y + dy);
      }
    }
    hole.closePath();
    panel.holes.push(hole);
  }
  parts.mesh(
    new ExtrudeGeometry(panel, {
      depth: 1.1,
      bevelEnabled: true,
      bevelSize: 0.1,
      bevelThickness: 0.1,
      bevelSegments: 2,
      curveSegments: 32,
    }),
    parts.rear,
    [0, 0, -0.55],
    "Black rear connection panel with through-cut connector openings"
  );
}
