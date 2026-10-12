import { Box3, ExtrudeGeometry, Path, Shape, Vector3 } from "three";
import { createNodeParts, horizontalPlate, roundedOutline } from "./node-parts";
import type { NodeParts } from "./node-parts";
import { createNodeRear } from "./node-rear";
import { createNodeTop } from "./node-top";

function lowerOutline() {
  const shape = new Shape();
  // Leave the straight front edge recessed so the separate face can carry a bored jack.
  shape.moveTo(-91.6, -72.6);
  shape.lineTo(-91.6, -71.2);
  shape.lineTo(91.6, -71.2);
  shape.lineTo(91.6, -72.6);
  shape.quadraticCurveTo(109.6, -72.6, 109.6, -54.6);
  shape.lineTo(109.6, 54.6);
  shape.quadraticCurveTo(109.6, 72.6, 91.6, 72.6);
  shape.lineTo(-91.6, 72.6);
  shape.quadraticCurveTo(-109.6, 72.6, -109.6, 54.6);
  shape.lineTo(-109.6, -54.6);
  shape.quadraticCurveTo(-109.6, -72.6, -91.6, -72.6);
  shape.closePath();
  return shape;
}

function headphoneJack(parts: NodeParts) {
  const face = new Shape();
  face.moveTo(-91.6, 2.4);
  face.lineTo(91.6, 2.4);
  face.lineTo(91.6, 19.4);
  face.lineTo(-91.6, 19.4);
  face.closePath();
  const hole = new Path();
  hole.absarc(0, 10.2, 2.1, 0, Math.PI * 2, true);
  face.holes.push(hole);
  parts.mesh(
    new ExtrudeGeometry(face, {
      depth: 1.1,
      bevelEnabled: true,
      bevelSize: 0.3,
      bevelThickness: 0.3,
      bevelSegments: 4,
      curveSegments: 32,
    }),
    parts.matte,
    [0, 0, 71.6],
    "Front lower shell with a real headphone-jack opening"
  );
  parts.lathe(
    [
      [2.15, 0],
      [2.15, 0.15],
      [1.8, 0.2],
      [1.75, -1.1],
    ],
    [0, 10.2, 73.01],
    parts.steel,
    "Recessed 3.5 mm headphone socket rim"
  );
  parts.disc(1.76, [0, 10.2, 71.72], parts.cavity, "Headphone socket interior");
  parts.box(
    [0.35, 0.8, 0.8],
    [1.3, 10.2, 72.05],
    parts.gold,
    "Headphone jack spring contact",
    0.03
  );
}

function frontMarkings(parts: NodeParts) {
  parts.print(
    10,
    11,
    [0, 33.4, 73.03],
    (context) => {
      context.strokeStyle = "#b8babd";
      context.lineWidth = 0.62;
      context.lineJoin = "round";
      context.beginPath();
      context.moveTo(1.1, 1.2);
      context.lineTo(5.7, 1.2);
      context.bezierCurveTo(9.7, 1.2, 9.7, 5.8, 5.7, 5.8);
      context.lineTo(2.7, 5.8);
      context.bezierCurveTo(1.1, 5.8, 1.1, 6.6, 1.1, 7.4);
      context.lineTo(1.1, 9.8);
      context.lineTo(5.7, 9.8);
      context.bezierCurveTo(9.7, 9.8, 9.7, 4.5, 5.7, 4.5);
      context.lineTo(2.7, 4.5);
      context.bezierCurveTo(1.1, 4.5, 1.1, 3.7, 1.1, 2.9);
      context.closePath();
      context.stroke();
    },
    "Bluesound B front-panel logotype",
    512
  );
  parts.cylinder(
    1.15,
    0.2,
    [0, 21.4, 72.02],
    parts.trim,
    "Front status LED bezel"
  );
  parts.disc(
    0.7,
    [0, 21.4, 72.15],
    parts.signal,
    "Blue network-connected status LED"
  );
}

function underside(parts: NodeParts) {
  horizontalPlate(
    parts,
    roundedOutline(126, 96, 8),
    1.55,
    0.2,
    parts.rubber,
    "Inset non-slip support pad",
    0.2
  );
  for (const x of [-83, 83]) {
    for (const z of [-48, 48]) {
      parts.screw([x, 1.98, z], "bottom", true);
    }
  }
  const label = parts.print(
    56,
    22,
    [0, -0.01, -2],
    (context) => {
      context.fillStyle = "#80858c";
      context.textAlign = "center";
      context.font = "bold 4px Arial";
      context.fillText("BLUESOUND", 28, 5.5);
      context.font = "2.5px Arial";
      context.fillText("NODE · N130", 28, 10.5);
      context.font = "1.8px Arial";
      context.fillText("100–240V ~ 50/60Hz", 28, 14.5);
    },
    "Model identification without an invented serial number",
    512
  );
  label.rotation.x = Math.PI / 2;
}

/** NODE N130 Black from PDN photos. Component dimensions and unseen surfaces are estimates. */
export function createNodeN130() {
  const parts = createNodeParts();
  parts.root.name = "Bluesound NODE N130 Black — millimetres";
  const upper = roundedOutline(219.2, 145.2, 18);
  upper.holes.push(roundedOutline(145, 77, 8.5));
  horizontalPlate(
    parts,
    upper,
    22.2,
    23.4,
    parts.matte,
    "Matte satin upper shell with recessed control aperture",
    0.4
  );
  horizontalPlate(
    parts,
    lowerOutline(),
    17,
    2.4,
    parts.matte,
    "Rounded matte satin lower shell",
    0.4
  );
  horizontalPlate(
    parts,
    roundedOutline(217, 143, 17),
    3.8,
    19.5,
    parts.cavity,
    "Continuous recessed mid-body band",
    0.05
  );
  headphoneJack(parts);
  frontMarkings(parts);
  createNodeTop(parts);
  createNodeRear(parts);
  underside(parts);
  const bounds = new Box3().setFromObject(parts.root);
  const size = bounds.getSize(new Vector3());
  parts.root.scale.set(220 / size.x, 46 / size.y, 146 / size.z);
  parts.root.position.y = -bounds.min.y * parts.root.scale.y;
  return { group: parts.root, dispose: () => parts.dispose() };
}
