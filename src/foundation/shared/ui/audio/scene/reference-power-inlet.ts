import { ExtrudeGeometry, Path, Shape, Vector2 } from "three";
import type { ModelParts } from "./parts";
import { connectorShellGeometry } from "./connector-geometry";

const OUTLINE = [
  [-8.4, -12],
  [3.8, -12],
  [8.4, -7.5],
  [8.4, 7.5],
  [3.8, 12],
  [-8.4, 12],
] as const;
export const powerInletOpening = OUTLINE.map(
  ([x, y]) => [x * 0.88, y * 0.91] as const
);

export function powerInletCutout() {
  const hole = new Path(
    powerInletOpening.map(([x, y]) => new Vector2(110 + x, 42 + y))
  );
  hole.closePath();
  return hole;
}

export function powerInlet(parts: ModelParts) {
  parts.mesh(
    connectorShellGeometry(
      [
        [-11.75, -15.75],
        [11.75, -15.75],
        [11.75, 15.75],
        [-11.75, 15.75],
      ],
      powerInletOpening,
      2.7,
      0.3
    ),
    parts.black,
    [110, 42, 0.65],
    "IEC C14 open mounting flange"
  );
  parts.mesh(
    connectorShellGeometry(OUTLINE, powerInletOpening, 10, 0.16),
    parts.black,
    [110, 42, -5.7],
    "Deep IEC inlet with molded cavity walls"
  );
  const floor = new Shape(powerInletOpening.map(([x, y]) => new Vector2(x, y)));
  parts.mesh(
    new ExtrudeGeometry(floor, { depth: 0.05, bevelEnabled: false }),
    parts.black,
    [110, 42, -5.75],
    "IEC inlet cavity"
  );
  for (const [dx, dy] of [
    [-3, -7],
    [1, 0],
    [-3, 7],
  ] as const) {
    parts.box(
      [3.1, 1, 7.2],
      [110 + dx, 42 + dy, -1.8],
      parts.steel,
      "Recessed IEC mains blade contact",
      0.15
    );
  }
}
