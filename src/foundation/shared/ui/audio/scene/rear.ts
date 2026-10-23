import {
  ExtrudeGeometry,
  Group,
  MeshStandardMaterial,
  Path,
  RingGeometry,
  Shape,
  Vector2,
} from "three";
import type { Material } from "three";
import type { ModelParts } from "./parts";
import { createBncSocket } from "./bnc-socket";
import { powerInlet } from "./reference-power-inlet";
import {
  createUd505RearPanel,
  serviceUsbOutline,
  serviceUsbOpening,
} from "./ud-505-rear-panel";
import {
  connectorShellGeometry,
  usbBOpening,
  usbBOutline,
} from "./connector-geometry";

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
  parts.lathe(
    [
      [3.1, 1.2],
      [3.1, 5.95],
    ],
    [x, y, 0],
    insulator,
    "Annular RCA colour insulator with an open centre"
  );
  parts.lathe(
    [
      [1.72, 5.95],
      [1.72, 1.2],
    ],
    [x, y, 0],
    insulator,
    "Inner wall of the RCA colour insulator"
  );
  parts.mesh(
    new RingGeometry(1.72, 3.1, 64),
    insulator,
    [x, y, 5.95],
    "Flat RCA colour-coding face"
  );
  parts.lathe(
    [
      [1.71, 2],
      [1.71, 5.9],
      [1.6, 6.05],
      [1.48, 5.85],
      [1.48, 2],
    ],
    [x, y, 0],
    parts.gold,
    "Recessed gold RCA centre-contact sleeve"
  );
  parts.disc(1.49, [x, y, 1.9], parts.cavity, "Deep RCA centre socket");
}

function xlr(parts: ModelParts, x: number, screwFinish: Material) {
  const y = 32;
  // 取付耳を本体と連続させ、ねじの周囲にも樹脂の肉厚を残す。
  const flange = new Shape();
  for (let step = 0; step <= 192; step += 1) {
    const angle = (step / 192) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let radius = 11.6;
    for (const [cx, cy] of [
      [-10, 9],
      [10, -9],
    ] as const) {
      const perpendicular = cx * dy - cy * dx;
      const parallel = cx * dx + cy * dy;
      if (Math.abs(perpendicular) < 3.1 && parallel > 0) {
        radius = Math.max(
          radius,
          parallel + Math.sqrt(3.1 ** 2 - perpendicular ** 2)
        );
      }
    }
    if (step === 0) {
      flange.moveTo(dx * radius, dy * radius);
    } else {
      flange.lineTo(dx * radius, dy * radius);
    }
  }
  flange.closePath();
  for (const [cx, cy, radius] of [
    [0, 0, 8.1],
    [-10, 9, 1.8],
    [10, -9, 1.8],
  ] as const) {
    const hole = new Path();
    hole.absarc(cx, cy, radius, 0, Math.PI * 2, true);
    flange.holes.push(hole);
  }
  parts.mesh(
    new ExtrudeGeometry(flange, {
      depth: 1.5,
      bevelEnabled: true,
      bevelSize: 0.2,
      bevelThickness: 0.15,
      bevelSegments: 3,
      curveSegments: 32,
    }),
    parts.black,
    [x, y, 0.65],
    "XLR flange with integral mounting ears and open screw seats"
  );
  parts.lathe(
    [
      [10, -6.6],
      [10, 4.8],
      [9.6, 5.7],
      [8.5, 5.9],
      [8.1, 5.3],
      [8.1, -6.6],
    ],
    [x, y, 0],
    parts.black,
    "Deep XLR output housing"
  );
  parts.disc(8.15, [x, y, -6.55], parts.black, "Recessed XLR pin-carrier face");
  for (const [dx, dy] of [
    [-4, 2],
    [4, 2],
    [0, -3],
  ] as const) {
    parts.lathe(
      [
        [0, -6.5],
        [0.79, -6.5],
        [0.79, 3.6],
        [0.75, 3.9],
        [0.55, 4.2],
        [0.2, 4.38],
        [0, 4.4],
      ],
      [x + dx, y + dy, 0],
      parts.gold,
      "Rounded gold XLR male pin"
    );
  }
  parts.print(
    14,
    14,
    [x, y, -6.5],
    (context) => {
      context.fillStyle = "#5b5c5c";
      context.font = "1.5px Arial";
      context.textAlign = "center";
      context.fillText("1", 2.5, 2.5);
      context.fillText("2", 11.5, 2.5);
      context.fillText("3", 7, 12.8);
    },
    "Molded XLR contact numbers",
    256
  );
  parts.box(
    [4, 0.4, 2],
    [x, y + 8, 4.3],
    parts.steel,
    "XLR polarising spring clip",
    0.08
  );
  parts
    .screw([x - 10, y + 9, 1.8], "front", true, screwFinish)
    .scale.set(1.45, 1.45, 2.3);
  parts
    .screw([x + 10, y - 9, 1.8], "front", true, screwFinish)
    .scale.set(1.45, 1.45, 2.3);
}

function polygon(
  parts: ModelParts,
  points: readonly (readonly [number, number])[],
  depth: number,
  position: readonly [number, number, number],
  material: Material,
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
  parts.mesh(
    connectorShellGeometry(
      [
        [-4.85, -5.2],
        [4.85, -5.2],
        [4.85, 5.2],
        [-4.85, 5.2],
      ],
      usbBOpening,
      0.5,
      0.1
    ),
    parts.black,
    [25.5, 54, 0.65],
    "Open USB-B mounting flange"
  );
  parts.mesh(
    connectorShellGeometry(usbBOutline, usbBOpening, 12),
    parts.steel,
    [25.5, 54, -8.8],
    "Hollow folded-metal USB-B shield"
  );
  polygon(
    parts,
    usbBOpening,
    0.04,
    [25.5, 54, -8.85],
    parts.cavity,
    "USB-B recessed socket"
  );
  const carrier = new Shape();
  carrier.moveTo(-2.4, -1.6);
  for (const x of [-1.25, 1.25]) {
    carrier.lineTo(x - 0.45, -1.6);
    carrier.lineTo(x - 0.45, -1.3);
    carrier.lineTo(x + 0.45, -1.3);
    carrier.lineTo(x + 0.45, -1.6);
  }
  carrier.lineTo(2.4, -1.6);
  carrier.lineTo(2.4, 1.6);
  for (const x of [1.25, -1.25]) {
    carrier.lineTo(x + 0.45, 1.6);
    carrier.lineTo(x + 0.45, 1.3);
    carrier.lineTo(x - 0.45, 1.3);
    carrier.lineTo(x - 0.45, 1.6);
  }
  carrier.lineTo(-2.4, 1.6);
  carrier.closePath();
  for (const dx of [-1.25, 1.25]) {
    for (const dy of [-1.75, 1.75]) {
      parts.box(
        [0.8, 0.22, 8],
        [25.5 + dx, 53.7 + dy, -3],
        parts.gold,
        "Recessed USB-B contact in an insulating channel",
        0.035
      );
    }
  }
  parts.mesh(
    new ExtrudeGeometry(carrier, {
      depth: 10.5,
      bevelEnabled: true,
      bevelSize: 0.04,
      bevelThickness: 0.04,
      bevelSegments: 2,
    }),
    parts.black,
    [25.5, 53.7, -8.3],
    "USB-B carrier with four open contact channels"
  );
  parts.mesh(
    connectorShellGeometry(serviceUsbOutline, serviceUsbOpening, 5.3, 0.05),
    parts.steel,
    [47, 25, -3.4],
    "Hollow trapezoidal service micro-USB shield"
  );
  polygon(
    parts,
    serviceUsbOpening,
    0.05,
    [47, 25, -3.45],
    parts.cavity,
    "Service micro-USB deep cavity"
  );
  parts.box(
    [5.6, 0.4, 2.7],
    [47, 25, -0.3],
    parts.black,
    "Service micro-USB insulating tongue",
    0.05
  );
  for (let index = 0; index < 5; index += 1) {
    parts.box(
      [0.3, 0.08, 1.9],
      [45.7 + index * 0.65, 24.76, -0.1],
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
  createBncSocket(parts, [82, 32, 0]);
  parts.cylinder(
    1.2,
    0.4,
    [88.8, 24.5, 0.9],
    parts.black,
    "Clock input mounting detail",
    16
  );
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
      const channel = (value: string, x: number, y: number) => {
        context.strokeRect(x + 135, 69 - y - 2.8, 4, 3.4);
        text(value, x, y, 2.6);
      };
      channel("R", -105, 58);
      channel("L", -21.5, 58);
      text("XLR", -105, 50);
      text("XLR", -21.5, 50);
      text("RCA", -79, 59.5);
      text("RCA", -46.5, 59.5);
      channel("R", -69, 59.5);
      channel("L", -56, 59.5);
      text("RCA", -78.5, 36);
      text("RCA", -46.5, 36);
      text("USB", 25.5, 44);
      text("COAXIAL", 49, 43);
      text("OPTICAL", 62.5, 19);
      text("10MHz IN", 82, 43);
      text("~ IN", 108, 62);
      text("CAN ICES-3(B)/NMB-3(B)", -109, 65, 1.8);
      text("CAUTION", 68, 61, 3.2);
      text("RISK OF ELECTRIC SHOCK", 68, 58.9, 1.45);
      text("DO NOT OPEN", 68, 56.9, 1.45);
      text("AVIS · RISQUE DE CHOC ÉLECTRIQUE", 68, 54.5, 1.3);
      text("NE PAS OUVRIR", 68, 52.9, 1.1);
      text("APPARATEN SKALL ANSLUTAS", 118, 66, 1.35);
      text("TILL JORDAT UTTAG.", 118, 63.8, 1.35);
      text("SERIAL", 101, 18.5, 1.9);
      text("NO.", 99, 15.8, 1.9);
      context.fillRect(107 + 137, 69 - 18.6, 25, 3.5);
      context.strokeRect(56 + 137, 69 - 63.6, 23, 7.5);
      context.strokeRect(126 + 137, 28, 3, 5);
      context.beginPath();
      context.moveTo(124 + 137, 27);
      context.lineTo(131 + 137, 34);
      context.moveTo(131 + 137, 27);
      context.lineTo(124 + 137, 34);
      context.stroke();
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
  createUd505RearPanel(parts);
  parts.box(
    [274, 11.5, 1.7],
    [0, 75.3, -0.25],
    parts.silver,
    "Brushed rear upper rail",
    0.4
  );
  const screwFinish = new MeshStandardMaterial({
    color: 0x68_6b_70,
    metalness: 0.7,
    roughness: 0.32,
  });
  xlr(parts, -105, screwFinish);
  xlr(parts, -21.5, screwFinish);
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
    [-92, 46],
    [-55, 46],
    [-71.5, 35.5],
    [-40, 35.5],
    [8, 50],
    [25.5, 61.5],
    [42.5, 50],
    [20.5, 31.5],
    [55.5, 37],
    [90.5, 35.5],
    [131, 41],
    [-49, 74],
    [51, 74],
  ] as const) {
    parts.screw([x, y, 1], "front", y < 69, y < 69 ? screwFinish : parts.steel);
  }
  const group = new Group();
  group.name = "Rear connections";
  group.add(...parts.root.children.slice(firstChild));
  group.rotation.y = Math.PI;
  group.position.z = -112;
  parts.root.add(group);
}
