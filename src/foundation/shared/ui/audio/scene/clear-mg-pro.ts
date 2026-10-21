import {
  Box3,
  BoxGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Object3D,
  Shape,
  TubeGeometry,
  Vector3,
} from "three";
import { createClearMgCup } from "./clear-mg-cups";
import { createClearMgParts } from "./clear-mg-parts";
import type { ClearMgParts } from "./clear-mg-parts";

const bandCenter = 135;
const bandStart = 0.085 * Math.PI;
const bandEnd = 0.915 * Math.PI;

function bandOutline(
  outerX: number,
  outerY: number,
  innerX: number,
  innerY: number
) {
  const shape = new Shape();
  shape.absellipse(0, bandCenter, outerX, outerY, bandStart, bandEnd, false, 0);
  shape.absellipse(0, bandCenter, innerX, innerY, bandEnd, bandStart, true, 0);
  shape.closePath();
  return shape;
}

function bandSeams(parts: ClearMgParts) {
  const points: Vector3[] = [];
  for (let index = 0; index <= 80; index += 1) {
    const angle = bandStart + (index / 80) * (bandEnd - bandStart);
    points.push(
      new Vector3(
        87.2 * Math.cos(angle),
        bandCenter + 93.2 * Math.sin(angle),
        17.5
      )
    );
  }
  for (const z of [-17.5, 17.5]) {
    parts.mesh(
      new TubeGeometry(
        new CatmullRomCurve3(
          points.map((point) => new Vector3(point.x, point.y, z))
        ),
        96,
        0.14,
        6,
        false
      ),
      parts.rubber,
      [0, 0, 0],
      "Leather headband edge piping"
    );
  }
  const stitches = parts.instanced(
    new BoxGeometry(0.85, 0.16, 0.13),
    parts.coated,
    160,
    "Fine headband edge stitching"
  );
  const placement = new Object3D();
  let index = 0;
  for (const z of [-17.55, 17.55]) {
    for (const point of points.slice(0, 80)) {
      placement.position.set(point.x, point.y, z);
      placement.rotation.set(
        0,
        0,
        Math.atan2(point.y - bandCenter, point.x) + 0.35
      );
      placement.updateMatrix();
      stitches.setMatrixAt(index, placement.matrix);
      index += 1;
    }
  }
  stitches.computeBoundingSphere();
}

function bandPerforations(parts: ClearMgParts) {
  const columns = 64;
  const rows = [-10, -6, -2, 2, 6, 10];
  const holes = parts.instanced(
    new CircleGeometry(0.4, 10),
    parts.perforation,
    columns * rows.length,
    "Perforations in the red headband lining"
  );
  const placement = new Object3D();
  const normalAxis = new Vector3(0, 0, 1);
  let index = 0;
  for (let row = 0; row < rows.length; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const angle =
        bandStart +
        0.045 +
        ((column + (row % 2) * 0.5) / columns) * (bandEnd - bandStart - 0.09);
      placement.position.set(
        73.15 * Math.cos(angle),
        bandCenter + 74.15 * Math.sin(angle),
        rows[row]
      );
      const normal = new Vector3(
        -Math.cos(angle) / 73.15,
        -Math.sin(angle) / 74.15,
        0
      ).normalize();
      placement.quaternion.setFromUnitVectors(normalAxis, normal);
      placement.updateMatrix();
      holes.setMatrixAt(index, placement.matrix);
      index += 1;
    }
  }
  holes.computeBoundingSphere();
}

function headband(parts: ClearMgParts) {
  parts.plate(
    bandOutline(88, 94, 81, 84),
    30,
    [0, 0, -15],
    parts.leather,
    "Rounded black leather headband cover",
    2.5
  );
  parts.plate(
    bandOutline(80.5, 83.5, 75, 76),
    25,
    [0, 0, -12.5],
    parts.microfiber,
    "Red microfiber cushion beneath the headband",
    1.8
  );
  bandSeams(parts);
  bandPerforations(parts);
  for (const side of [-1, 1]) {
    const sleeve = parts.box(
      [12, 17, 31],
      [side * 82.5, 153.5, 0],
      parts.coated,
      "Headband end cap and slider sleeve",
      1.5
    );
    sleeve.rotation.z = side * 0.28;
    const branding = parts.print(
      15,
      5,
      [side * 82.5, 153.5, 15.65],
      (context) => {
        context.fillStyle = "#e8e9ea";
        context.textAlign = "center";
        context.font = "bold 2.9px Arial";
        context.fillText("FOCAL", 7.5, 3.5);
      },
      "Focal headband end-cap marking",
      512
    );
    branding.rotation.z = side * 0.28;
  }
}

/** Black/red Professional finish. Exterior dimensions estimated from Focal photos. */
export function createClearMgPro() {
  const parts = createClearMgParts();
  parts.root.name =
    "Focal Clear Mg Professional Black / Red — estimated millimetres";
  headband(parts);
  createClearMgCup(parts, -1);
  createClearMgCup(parts, 1);
  const bounds = new Box3().setFromObject(parts.root);
  parts.root.position.y = -bounds.min.y;
  return { group: parts.root, dispose: () => parts.dispose() };
}
