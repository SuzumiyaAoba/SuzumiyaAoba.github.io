import { ExtrudeGeometry, Path, Shape, Vector2 } from "three";

type Outline = readonly (readonly [number, number])[];

/** コネクターの薄肉シールド。前面の開口から奥の接点を見通せる。 */
export function connectorShellGeometry(
  outer: Outline,
  inner: Outline,
  depth: number,
  bevel = 0.06
) {
  const outline = new Shape(outer.map(([x, y]) => new Vector2(x, y)));
  const opening = new Path(inner.map(([x, y]) => new Vector2(x, y)));
  opening.closePath();
  outline.holes.push(opening);
  return new ExtrudeGeometry(outline, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    curveSegments: 24,
  });
}

// USB 2.0 Series B receptacle mating opening: 8.45 × 7.78 mm.
export const usbBOutline = [
  [-4.55, -4.22],
  [4.55, -4.22],
  [4.55, 2.22],
  [2.55, 4.22],
  [-2.55, 4.22],
  [-4.55, 2.22],
] as const;
export const usbBOpening = [
  [-4.225, -3.89],
  [4.225, -3.89],
  [4.225, 2.09],
  [2.425, 3.89],
  [-2.425, 3.89],
  [-4.225, 2.09],
] as const;
