import { Box3, Vector3 } from "three";
import type { Camera } from "three";
import { createNodeParts, horizontalPlate, roundedOutline } from "./node-parts";
import type { NodeParts } from "./node-parts";
import { createNodeRear } from "./node-rear";
import { createNodeTop } from "./node-top";
import {
  nodeDimensions,
  nodeFrontGeometry,
  nodeBandOutline,
  nodeShellGeometry,
} from "./node-geometry";

function headphoneJack(parts: NodeParts) {
  const { front, headphoneY } = nodeDimensions;
  parts.mesh(
    nodeFrontGeometry(),
    parts.matte,
    [0, 0, front - 1.1],
    "Front lower shell with a through-bored headphone aperture"
  );
  parts.lathe(
    [
      [2.15, 0],
      [2.15, 0.15],
      [1.87, 0.3],
      [1.76, 0],
      [1.76, -4.6],
    ],
    [0, headphoneY, front - 0.35],
    parts.connectorMetal,
    "Rolled metal lip and deep 3.5 mm headphone sleeve"
  );
  parts.disc(
    1.77,
    [0, headphoneY, front - 4.35],
    parts.cavity,
    "Headphone socket interior"
  );
  for (const [x, z] of [
    [1.48, -2.4],
    [-1.48, -3.6],
  ] as const) {
    const contact = parts.box(
      [0.24, 0.9, 1.3],
      [x, headphoneY, front + z],
      parts.gold,
      "Recessed headphone-jack spring contact",
      0.06
    );
    contact.rotation.y = Math.sign(x) * 0.1;
  }
}

function enclosure(parts: NodeParts) {
  for (const upper of [false, true]) {
    parts.mesh(
      nodeShellGeometry(upper),
      parts.matte,
      [0, 0, 0],
      upper
        ? "Continuous upper enclosure with rounded top edges"
        : "Continuous lower side walls with an open rear"
    );
  }
  const belt = horizontalPlate(
    parts,
    nodeBandOutline(),
    8.4,
    22.1,
    parts.waist,
    "Continuous recessed mid-body band",
    0.15
  );
  belt.geometry.scale(0.994, 0.994, 1);
  parts.box(
    [201, 2.8, 2],
    [0, 7.5, -70.4],
    parts.matte,
    "Rear lower return beneath the connection panel",
    0.4
  );
}

function frontMarkings(parts: NodeParts) {
  parts.print(
    9,
    9.9,
    [0, 37, 73.03],
    (context) => {
      context.scale(0.9, 0.9);
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
    [0, nodeDimensions.statusY, 72.08],
    parts.trim,
    "Front status LED bezel"
  );
  parts.disc(
    0.7,
    [0, nodeDimensions.statusY, 72.21],
    parts.signal,
    "Blue network-connected status LED"
  );
}

function underside(parts: NodeParts) {
  horizontalPlate(
    parts,
    roundedOutline(218.8, 144.8, 17.4),
    1.3,
    5.4,
    parts.matte,
    "Molded underside return",
    0.3
  );
  horizontalPlate(
    parts,
    roundedOutline(190, 121, 12),
    2.6,
    2.1,
    parts.trim,
    "Recessed stepped base plinth",
    0.45
  );
  horizontalPlate(
    parts,
    roundedOutline(126, 96, 8),
    1.7,
    0.2,
    parts.rubber,
    "Inset non-slip support pad",
    0.2
  );
  for (const x of [-83, 83]) {
    for (const z of [-48, 48]) {
      parts.screw([x, 1.85, z], "bottom", true);
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
  enclosure(parts);
  headphoneJack(parts);
  frontMarkings(parts);
  createNodeTop(parts);
  createNodeRear(parts);
  underside(parts);
  const bounds = new Box3().setFromObject(parts.root);
  const size = bounds.getSize(new Vector3());
  parts.root.scale.set(220 / size.x, 46 / size.y, 146 / size.z);
  parts.root.position.y = -bounds.min.y * parts.root.scale.y;
  return {
    group: parts.root,
    updateDetail: (camera: Camera, viewportHeight: number) =>
      parts.detail.update(camera, viewportHeight),
    dispose: () => parts.dispose(),
  };
}
