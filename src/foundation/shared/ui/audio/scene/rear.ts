import {
  ExtrudeGeometry,
  Group,
  MeshStandardMaterial,
  Shape,
  Vector2,
} from "three";
import type { ModelParts } from "./parts";

function rca(parts: ModelParts, x: number, y: number, color: number) {
  const insulator = new MeshStandardMaterial({ color, roughness: 0.5 });
  parts.cylinder(5.1, 1.4, [x, y, 0.9], parts.steel, "RCA mounting washer");
  parts.lathe(
    [
      [4.5, 0],
      [4.5, 4.6],
      [4, 5],
      [3.1, 5],
      [3.1, 0],
    ],
    [x, y, 1],
    parts.gold,
    "Gold-plated RCA shell"
  );
  parts.cylinder(3.1, 0.65, [x, y, 5.7], insulator, "RCA colour insulator");
  parts.disc(1.5, [x, y, 6.06], parts.cavity, "RCA centre socket");
  parts.ring(1.65, 0.12, [x, y, 6.06], parts.gold, "RCA centre contact");
}

function xlr(parts: ModelParts, x: number) {
  const y = 32;
  parts.cylinder(11.6, 1.8, [x, y, 1.2], parts.black, "XLR mounting flange");
  parts.lathe(
    [
      [10, 0],
      [10, 4.5],
      [8.9, 5],
      [8.1, 5],
      [8.1, 0],
    ],
    [x, y, 1],
    parts.black,
    "XLR output housing"
  );
  parts.disc(8.1, [x, y, 1.1], parts.cavity, "XLR interior");
  for (const [dx, dy] of [
    [-4, 2],
    [4, 2],
    [0, -3],
  ] as const) {
    parts.cylinder(
      0.75,
      3.8,
      [x + dx, y + dy, 3.1],
      parts.gold,
      "XLR output pin",
      16
    );
  }
  parts.box(
    [4, 0.6, 1.5],
    [x, y + 8.1, 4.8],
    parts.steel,
    "XLR alignment key",
    0.1
  );
  parts.screw([x - 10, y + 9, 1.3], "front", true);
  parts.screw([x + 10, y - 9, 1.3], "front", true);
}

function polygon(
  parts: ModelParts,
  points: readonly (readonly [number, number])[],
  depth: number,
  position: readonly [number, number, number],
  material: ModelParts["steel"],
  name: string
) {
  const shape = new Shape(points.map(([x, y]) => new Vector2(x, y)));
  return parts.mesh(
    new ExtrudeGeometry(shape, { depth, bevelEnabled: false }),
    material,
    position,
    name
  );
}

function usb(parts: ModelParts) {
  parts.box(
    [9.7, 10.4, 1.1],
    [25.5, 54, 1.1],
    parts.black,
    "USB-B flange",
    0.7
  );
  const profile = [
    [-4, -4],
    [4, -4],
    [4, 2],
    [2, 4],
    [-2, 4],
    [-4, 2],
  ] as const;
  polygon(
    parts,
    profile,
    1.5,
    [25.5, 54, 1.4],
    parts.steel,
    "USB-B chamfered shield"
  );
  const inset = [
    [-3.4, -3.5],
    [3.4, -3.5],
    [3.4, 1.6],
    [1.7, 3.3],
    [-1.7, 3.3],
    [-3.4, 1.6],
  ] as const;
  polygon(
    parts,
    inset,
    0.2,
    [25.5, 54, 2.91],
    parts.black,
    "USB-B recessed socket"
  );
  parts.box(
    [4.8, 2.7, 0.6],
    [25.5, 53.5, 3.2],
    parts.rear,
    "USB-B contact tongue",
    0.05
  );
  for (const x of [24.3, 26.7]) {
    for (const y of [53, 54]) {
      parts.box(
        [0.6, 0.28, 0.15],
        [x, y, 3.57],
        parts.gold,
        "USB-B contact",
        0.03
      );
    }
  }
  parts.box(
    [8.2, 3, 0.9],
    [47, 25, 1.3],
    parts.steel,
    "Service micro-USB shield",
    1
  );
  parts.box(
    [7.2, 1.7, 0.2],
    [47, 25, 1.82],
    parts.cavity,
    "Service micro-USB socket",
    0.6
  );
  for (let index = 0; index < 5; index += 1) {
    parts.box(
      [0.35, 0.28, 0.15],
      [45.6 + index * 0.7, 25, 1.97],
      parts.gold,
      "Service connector contact",
      0.02
    );
  }
}

function digitalInputs(parts: ModelParts) {
  rca(parts, 63, 47, 0xe9_77_23);
  parts.box(
    [9.5, 11.5, 3.2],
    [63, 30.5, 2],
    parts.black,
    "TOSLINK optical connector",
    0.3
  );
  parts.box(
    [6.1, 7.1, 0.8],
    [63, 30.5, 3.8],
    parts.rear,
    "Spring-loaded optical shutter",
    0.4
  );
  parts.box(
    [5.2, 0.6, 0.8],
    [63, 34, 4.1],
    parts.steel,
    "Optical shutter hinge",
    0.1
  );
  parts.cylinder(
    6.5,
    1.1,
    [82, 32, 1.1],
    parts.gold,
    "10 MHz BNC mounting nut",
    6
  );
  parts.lathe(
    [
      [5.6, 0],
      [5.6, 6],
      [4.8, 6.5],
      [3.4, 6.5],
      [3.4, 0],
    ],
    [82, 32, 1.7],
    parts.gold,
    "BNC bayonet shell"
  );
  parts.cylinder(3.3, 0.6, [82, 32, 7.9], parts.silver, "BNC dielectric");
  parts.disc(1.25, [82, 32, 8.22], parts.cavity, "BNC centre contact");
  for (const dx of [-5.8, 5.8]) {
    parts.box(
      [1.6, 1.7, 1.5],
      [82 + dx, 32, 5.8],
      parts.gold,
      "BNC bayonet lug",
      0.2
    );
  }
  parts.cylinder(
    1.2,
    0.4,
    [88.8, 24.5, 0.9],
    parts.black,
    "Clock input mounting detail",
    16
  );
}

export function powerInlet(parts: ModelParts) {
  parts.box(
    [23.5, 31.5, 3.7],
    [110, 42, 1.8],
    parts.black,
    "IEC C14 mains inlet flange",
    0.9
  );
  const outline = [
    [-8.4, -12],
    [3.8, -12],
    [8.4, -7.5],
    [8.4, 7.5],
    [3.8, 12],
    [-8.4, 12],
  ] as const;
  polygon(parts, outline, 0.6, [110, 42, 3.7], parts.steel, "IEC socket edge");
  const opening = outline.map(([x, y]) => [x * 0.96, y * 0.96] as const);
  polygon(
    parts,
    opening,
    0.3,
    [110, 42, 4.31],
    parts.black,
    "IEC inlet cavity"
  );
  for (const [dx, dy] of [
    [-3, -7],
    [1, 0],
    [-3, 7],
  ] as const) {
    parts.box(
      [3.1, 1, 3.5],
      [110 + dx, 42 + dy, 4.9],
      parts.steel,
      "IEC mains contact",
      0.1
    );
  }
}

function lettering(parts: ModelParts) {
  parts.print(
    274,
    56,
    [0, 41, 0.66],
    (context) => {
      context.fillStyle = "#c8cacc";
      context.strokeStyle = "#a5a8ab";
      context.lineWidth = 0.25;
      context.textAlign = "center";
      const text = (value: string, x: number, y: number, size = 2.6) => {
        context.font = `${size}px Arial, sans-serif`;
        context.fillText(value, x + 137, 69 - y);
      };
      const bar = (value: string, x: number, y: number, width: number) => {
        context.fillStyle = "#b9bdc1";
        context.fillRect(x + 137 - width / 2, 69 - y - 2.5, width, 3.3);
        context.fillStyle = "#222529";
        text(value, x, y, 2.7);
        context.fillStyle = "#c8cacc";
      };
      bar("LINE IN", -62.5, 64, 53);
      bar("LINE OUT", -63, 16, 126);
      bar("DIGITAL IN", 54, 15.8, 29);
      bar("CLOCK SYNC", 82, 15.8, 23);
      text("R", -105, 58);
      text("L", -21.5, 58);
      text("XLR", -105, 50);
      text("XLR", -21.5, 50);
      text("RCA   R", -78.5, 59.5);
      text("L   RCA", -46.5, 59.5);
      text("RCA", -78.5, 36);
      text("RCA", -46.5, 36);
      text("USB", 25.5, 44);
      text("COAXIAL", 49, 43);
      text("OPTICAL", 62.5, 19);
      text("10MHz IN", 82, 43);
      text("~ IN", 108, 62);
      text("CAN ICES-3(B)/NMB-3(B)", -109, 65, 1.8);
      text("CAUTION", 68, 61, 3.2);
      text("RISK OF ELECTRIC SHOCK", 68, 57.5, 1.45);
      text("DO NOT OPEN", 68, 55.5, 1.45);
      text("AVIS · RISQUE DE CHOC ÉLECTRIQUE", 68, 52.5, 1.4);
      text("APPARATEN SKALL ANSLUTAS", 118, 66, 1.35);
      text("TILL JORDAT UTTAG.", 118, 63.8, 1.35);
      text("SERIAL", 101, 18.5, 1.9);
      text("NO.", 99, 15.8, 1.9);
      context.fillRect(107 + 137, 69 - 18.6, 25, 3.5);
      context.strokeRect(56 + 137, 69 - 63.6, 23, 10.5);
      context.strokeRect(-91 + 137, 69 - 66.5, 57, 24);
      context.beginPath();
      context.moveTo(137, 5);
      context.lineTo(137, 52);
      context.moveTo(137 - 62.5, 9);
      context.lineTo(137 - 62.5, 42);
      context.moveTo(137 + 70.5, 22);
      context.lineTo(137 + 70.5, 54);
      context.stroke();
      for (const [x, symbol] of [
        [49, "ϟ"],
        [86, "!"],
      ] as const) {
        context.beginPath();
        context.moveTo(x + 137, 3);
        context.lineTo(x + 131.5, 12.8);
        context.lineTo(x + 142.5, 12.8);
        context.closePath();
        context.fill();
        context.fillStyle = "#222529";
        context.font = "bold 6px Arial";
        context.fillText(symbol, x + 137, 11.5);
        context.fillStyle = "#c8cacc";
      }
    },
    "Rear-panel connection legends"
  );
}

export function createRear(parts: ModelParts) {
  const firstChild = parts.root.children.length;
  parts.box(
    [274, 56, 1.1],
    [0, 41, 0],
    parts.rear,
    "Black rear connection panel",
    0.3
  );
  parts.box(
    [274, 11.5, 1.7],
    [0, 75.3, -0.25],
    parts.silver,
    "Brushed rear upper rail",
    0.4
  );
  xlr(parts, -105);
  xlr(parts, -21.5);
  for (const y of [27, 54]) {
    rca(parts, -78.5, y, 0xb3_1e_26);
    rca(parts, -46.5, y, 0xe0_da_ce);
  }
  usb(parts);
  digitalInputs(parts);
  powerInlet(parts);
  parts.box(
    [36, 10, 3.4],
    [21, 24, 1.9],
    parts.black,
    "Bluetooth antenna enclosure",
    1
  );
  parts.print(
    33,
    7,
    [21, 24, 3.67],
    (context) => {
      context.fillStyle = "#34383d";
      context.font = "bold 3.7px Arial";
      context.textAlign = "center";
      context.fillText("ᛒ Bluetooth", 16.5, 4.8);
    },
    "Embossed Bluetooth marking",
    512
  );
  lettering(parts);
  for (const [x, y] of [
    [-130, 42],
    [-92, 44],
    [-59, 44],
    [8, 50],
    [25.5, 59],
    [42.5, 50],
    [20.5, 31.5],
    [55.5, 37],
    [90.5, 35.5],
    [131, 41],
    [-49, 74],
    [51, 74],
  ] as const) {
    parts.screw([x, y, 1], "front", y < 69);
  }
  const group = new Group();
  group.name = "Rear connections";
  group.add(...parts.root.children.slice(firstChild));
  group.rotation.y = Math.PI;
  group.position.z = -112;
  parts.root.add(group);
}
