import {
  ExtrudeGeometry,
  Group,
  MeshStandardMaterial,
  Shape,
  Vector2,
} from "three";
import type { Material } from "three";
import { roundedOutline } from "./node-parts";
import type { NodeParts } from "./node-parts";
import { nodeDimensions, nodeRearPanelGeometry } from "./node-geometry";
import { connectorShellGeometry } from "./connector-geometry";

function polygon(
  parts: NodeParts,
  points: readonly (readonly [number, number])[],
  position: readonly [number, number, number],
  depth: number,
  material: Material,
  name: string
) {
  const outline = new Shape(points.map(([x, y]) => new Vector2(x, y)));
  return parts.mesh(
    new ExtrudeGeometry(outline, { depth, bevelEnabled: false }),
    material,
    position,
    name
  );
}

function rca(parts: NodeParts, x: number, color: number) {
  const y = 25;
  parts.lathe(
    [
      [4.55, 0],
      [4.55, 0.7],
      [4.1, 0.95],
      [4.1, 3.3],
      [3.7, 3.7],
      [2.9, 3.7],
      [2.9, 0],
    ],
    [x, y, 0.9],
    parts.gold,
    "Gold-plated RCA shell"
  );
  parts.lathe(
    [
      [2.85, -0.4],
      [2.85, 4.5],
      [1.63, 4.5],
      [1.63, -0.4],
    ],
    [x, y, 0],
    new MeshStandardMaterial({ color, roughness: 0.6 }),
    "RCA annular colour-coded dielectric"
  );
  parts.lathe(
    [
      [1.62, -0.5],
      [1.62, 4.48],
      [1.5, 4.6],
      [1.35, 4.4],
      [1.35, -0.5],
    ],
    [x, y, 0],
    parts.gold,
    "Deep RCA female centre-contact sleeve"
  );
  parts.disc(1.36, [x, y, -0.6], parts.cavity, "RCA female socket floor");
}

function miniJack(parts: NodeParts, x: number) {
  parts.lathe(
    [
      [3.05, 0],
      [3.05, 0.3],
      [2.4, 0.5],
      [1.78, 0.5],
      [1.78, -4.5],
    ],
    [x, 20.9, 1],
    parts.trim,
    "3.5 mm input/trigger socket surround"
  );
  parts.disc(
    1.78,
    [x, 20.9, -3.55],
    parts.cavity,
    "Deep 3.5 mm input/trigger jack"
  );
  parts.box(
    [0.3, 0.8, 0.4],
    [x + 1.5, 20.9, -1.8],
    parts.connectorMetal,
    "Mini-jack spring contact",
    0.03
  );
}

function opticalOutput(parts: NodeParts) {
  parts.facePlate(
    [11.5, 10.5, 2.2],
    [-23.5, 25, 1.5],
    parts.black,
    "TOSLINK socket housing",
    0.6
  );
  polygon(
    parts,
    [
      [-3.8, 3.6],
      [3.8, 3.6],
      [3.8, -1.8],
      [2, -3.6],
      [-2, -3.6],
      [-3.8, -1.8],
    ],
    [-23.5, 25, 2.62],
    0.15,
    parts.cavity,
    "Keyed TOSLINK opening"
  );
  parts.box(
    [6.5, 6.1, 0.45],
    [-23.5, 24.8, 2.75],
    parts.trim,
    "Closed spring-loaded optical shutter",
    0.3
  );
  parts.box(
    [6.4, 0.55, 0.55],
    [-23.5, 28.6, 2.98],
    parts.steel,
    "Optical shutter hinge",
    0.1
  );
}

function lanAndUsb(parts: NodeParts) {
  const x = 27.5;
  const shield = roundedOutline(18.5, 23.8, 0.6);
  const ethernetPoints = [
    [-6.7, -5.4],
    [6.7, -5.4],
    [6.7, 1.8],
    [4.5, 1.8],
    [4.5, 3.4],
    [2.7, 3.4],
    [2.7, 5.4],
    [-2.7, 5.4],
    [-2.7, 3.4],
    [-4.5, 3.4],
    [-4.5, 1.8],
    [-6.7, 1.8],
  ] as const;
  const ethernet = new Shape(
    ethernetPoints.map(([px, py]) => new Vector2(px, py + 4.8))
  );
  shield.holes.push(ethernet);
  const usb = roundedOutline(12.5, 5.12, 0.2);
  const usbHole = new Shape(
    usb.getPoints(12).map((point) => new Vector2(point.x, point.y - 6.7))
  );
  shield.holes.push(usbHole);
  parts.mesh(
    new ExtrudeGeometry(shield, {
      depth: 11.8,
      bevelEnabled: true,
      bevelSize: 0.07,
      bevelThickness: 0.07,
      bevelSegments: 3,
      curveSegments: 16,
    }),
    parts.connectorMetal,
    [x, 28.1, -9.9],
    "Stacked RJ45/USB-A shield with through-openings"
  );
  parts.facePlate(
    [17, 22.4, 0.15],
    [x, 28.1, -10],
    parts.cavity,
    "LAN/USB recessed interior",
    0.3
  );
  for (let index = 0; index < 8; index += 1) {
    const spring = parts.box(
      [0.3, 0.25, 4.8],
      [x - 3.57 + index * 1.02, 29.3, -1.7],
      parts.gold,
      "RJ45 eight spring contacts",
      0.03
    );
    spring.rotation.x = -0.3;
  }
  for (const side of [-1, 1]) {
    parts.box(
      [0.45, 6.2, 0.45],
      [x + side * 6.85, 31.8, 1.8],
      parts.connectorMetal,
      "RJ45 shield retaining finger",
      0.05
    );
  }
  parts.box(
    [10.7, 1.65, 10],
    [x, 22.2, -4.1],
    parts.black,
    "USB-A contact tongue",
    0.08
  );
  for (let index = 0; index < 4; index += 1) {
    parts.box(
      [1, 0.12, 7],
      [x + (index - 1.5) * 2.5, 21.32, -3.3],
      parts.gold,
      "USB-A four contacts",
      0.03
    );
  }
  for (const offset of [-7.7, 7.7]) {
    for (const y of [36.5, 28, 18]) {
      parts.box(
        [0.75, 1.1, 0.1],
        [x + offset, y, 1.96],
        parts.cavity,
        "Stamped shield notch",
        0.02
      );
    }
  }
}

function hdmi(parts: NodeParts) {
  const x = 54;
  const y = 22.5;
  const shieldPoints = [
    [-8, 3.4],
    [8, 3.4],
    [8, -1.4],
    [5.8, -3.5],
    [-5.8, -3.5],
    [-8, -1.4],
  ] as const;
  parts.mesh(
    connectorShellGeometry(
      shieldPoints,
      shieldPoints.map(([px, py]) => [px * 0.9, py * 0.82] as const),
      6.5
    ),
    parts.connectorMetal,
    [x, y, -4.1],
    "HDMI eARC trapezoidal shield"
  );
  polygon(
    parts,
    shieldPoints,
    [x, y, -4.25],
    0.1,
    parts.cavity,
    "Recessed HDMI socket interior"
  );
  parts.box(
    [10.8, 1, 4.2],
    [x, y, -0.5],
    parts.black,
    "HDMI contact tongue",
    0.1
  );
  for (let index = 0; index < 19; index += 1) {
    const upper = index % 2 === 0;
    const column = Math.floor(index / 2);
    parts.box(
      [0.3, 0.12, 2.8],
      [
        x - 4.5 + column * 0.96 + (upper ? 0 : 0.48),
        y + (upper ? 0.56 : -0.56),
        -0.3,
      ],
      parts.gold,
      "HDMI nineteen contacts",
      0.02
    );
  }
}

function mainsInlet(parts: NodeParts) {
  const x = 81.5;
  const y = 23.8;
  const opening = new Shape();
  opening.moveTo(-4, 4.3);
  opening.bezierCurveTo(-10.1, 4.3, -10.1, -4.3, -4, -4.3);
  opening.quadraticCurveTo(-1.1, -4.3, 0, -2.2);
  opening.quadraticCurveTo(1.1, -4.3, 4, -4.3);
  opening.bezierCurveTo(10.1, -4.3, 10.1, 4.3, 4, 4.3);
  opening.quadraticCurveTo(1.1, 4.3, 0, 2.2);
  opening.quadraticCurveTo(-1.1, 4.3, -4, 4.3);
  opening.closePath();
  const surround = roundedOutline(24, 14.5, 7);
  surround.holes.push(opening);
  parts.mesh(
    new ExtrudeGeometry(surround, {
      depth: 6.4,
      bevelEnabled: true,
      bevelSize: 0.15,
      bevelThickness: 0.15,
      bevelSegments: 4,
      curveSegments: 32,
    }),
    parts.black,
    [x, y, -4],
    "IEC C8 figure-eight mains inlet"
  );
  parts.facePlate(
    [22, 13, 0.2],
    [x, y, -4.2],
    parts.cavity,
    "Figure-eight inlet interior",
    6
  );
  for (const offset of [-4.5, 4.5]) {
    parts.lathe(
      [
        [0, -4],
        [1, -4],
        [1, 0.8],
        [0.85, 1.05],
        [0, 1.25],
      ],
      [x + offset, y, 0],
      parts.connectorMetal,
      "Rounded recessed IEC C8 mains pins"
    );
  }
}

function lettering(parts: NodeParts) {
  parts.print(
    202,
    31.4,
    [0, 25.1, 0.67],
    (context) => {
      context.fillStyle = "#a8b7c6";
      context.textAlign = "center";
      const text = (value: string, x: number, y: number, size = 1.9) => {
        context.font = `${size}px Arial`;
        context.fillText(value, x + 101, 40.8 - y);
      };
      text("AUDIO OUT", -77.5, 37.2);
      text("R", -85, 33.5);
      text("L", -70, 33.5);
      text("SUBW", -54, 37.2);
      text("OUT", -54, 34);
      text("COAX", -39, 37.2);
      text("OUT", -39, 34);
      text("OPTICAL", -23.5, 33.6);
      text("OUT", -23.5, 30.7);
      text("OPTICAL IN/", -9.5, 28.8, 1.65);
      text("ANALOG IN", -9.5, 26, 1.65);
      text("TRIGGER", 2.5, 28.8, 1.65);
      text("OUT", 2.5, 26, 1.65);
      text("IR", 12.5, 28.8, 1.65);
      text("IN", 12.5, 26, 1.65);
      text("LAN / USB", 27.5, 12.4);
      text("HDMI eARC", 54, 12.4);
      text("100–240V~50/60Hz", 81.5, 12.4, 1.65);
      context.textAlign = "left";
      text("Bluesound International", 39, 37.5, 2.6);
      text("633 Granite Court, Pickering, Ontario, Canada", 39, 34.9, 1.15);
      text("Model: NODE", 39, 32.9, 1.4);
      text("Wireless Music Streamer", 39, 31, 1.35);
      text("Power Rating: 100–240V~50/60Hz 15W", 39, 29.1, 1.25);
    },
    "NODE N130 rear connection legends and manufacturer marking"
  );
}

export function createNodeRear(parts: NodeParts) {
  const firstChild = parts.root.children.length;
  const returnFrame = roundedOutline(205.6, 34.8, 4.2);
  returnFrame.holes.push(roundedOutline(201.8, 31.2, 2.3));
  parts.mesh(
    new ExtrudeGeometry(returnFrame, {
      depth: 3.5,
      bevelEnabled: true,
      bevelSize: 0.15,
      bevelThickness: 0.15,
      bevelSegments: 3,
      curveSegments: 32,
    }),
    parts.panel,
    [0, 25.1, -0.5],
    "Molded rear-panel return sealing the recessed enclosure opening"
  );
  parts.mesh(
    nodeRearPanelGeometry(),
    parts.panel,
    [0, 0, -0.5],
    "Recessed rear connection panel with open socket cutouts"
  );
  parts.facePlate(
    [65, 18.2, 0.25],
    [-62, 25, -3.1],
    parts.cavity,
    "RCA socket recess",
    8.8
  );
  const rcaPocket = roundedOutline(64, 17.2, 8.2);
  rcaPocket.holes.push(roundedOutline(63, 16.2, 7.8));
  parts.mesh(
    new ExtrudeGeometry(rcaPocket, {
      depth: 3.5,
      bevelEnabled: true,
      bevelSize: 0.1,
      bevelThickness: 0.1,
      bevelSegments: 3,
      curveSegments: 32,
    }),
    parts.panel,
    [-62, 25, -3],
    "Molded walls around the recessed four-RCA connector bay"
  );
  for (const [x, color] of [
    [-85, 0xe4_43_21],
    [-70, 0xe9_e7_de],
    [-54, 0x10_12_14],
    [-39, 0xf3_ad_12],
  ] as const) {
    rca(parts, x, color);
  }
  opticalOutput(parts);
  for (const x of [-9.5, 2.5, 12.5]) {
    miniJack(parts, x);
  }
  lanAndUsb(parts);
  hdmi(parts);
  mainsInlet(parts);
  lettering(parts);
  const group = new Group();
  group.name = "NODE N130 rear connections";
  group.add(...parts.root.children.slice(firstChild));
  group.rotation.y = Math.PI;
  group.position.z = nodeDimensions.rear;
  parts.root.add(group);
}
