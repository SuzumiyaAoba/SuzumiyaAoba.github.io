import { Group, MeshStandardMaterial } from "three";
import type { ModelParts } from "./parts";
import { powerInlet } from "./rear";

function clockOutput(parts: ModelParts, x: number) {
  const y = 31.5;
  parts.lathe(
    [
      [0, 0],
      [6.5, 0],
      [6.5, 1.1],
      [5.9, 1.5],
      [0, 1.5],
    ],
    [x, y, 0.6],
    parts.gold,
    "Clock output mounting washer"
  );
  parts.lathe(
    [
      [5.6, 0],
      [5.6, 6],
      [4.8, 6.5],
      [3.4, 6.5],
      [3.4, 0],
    ],
    [x, y, 1.7],
    parts.gold,
    "Gold-plated 50-ohm BNC output shell"
  );
  parts.cylinder(
    3.3,
    0.6,
    [x, y, 7.9],
    new MeshStandardMaterial({ color: 0xf0_ef_e5, roughness: 0.8 }),
    "BNC dielectric"
  );
  parts.disc(1.25, [x, y, 8.22], parts.cavity, "BNC centre socket");
  parts.lathe(
    [
      [0.82, 0],
      [0.82, 0.28],
      [0.48, 0.28],
      [0.48, 0],
    ],
    [x, y, 8.23],
    parts.gold,
    "Hollow BNC centre contact"
  );
  for (const offset of [-0.65, 0.65]) {
    parts.box(
      [0.13, 0.6, 0.06],
      [x + offset, y, 8.54],
      parts.cavity,
      "BNC centre-contact spring split",
      0.01
    );
  }
  for (const offset of [-5.8, 5.8]) {
    parts.box(
      [1.6, 1.7, 1.5],
      [x + offset, y, 5.8],
      parts.gold,
      "BNC bayonet lug",
      0.2
    );
  }
  parts.screw([x + 8, y + 7, 1], "front", true);
  parts.cylinder(
    1.2,
    0.4,
    [x + 6.5, y - 7.5, 0.9],
    parts.black,
    "Clock output mounting detail",
    16
  );
}

function rearLettering(parts: ModelParts) {
  parts.print(
    274,
    56,
    [0, 41, 0.66],
    (context) => {
      context.fillStyle = "#c8cacc";
      context.strokeStyle = "#c8cacc";
      context.lineWidth = 0.3;
      context.textAlign = "center";
      const text = (value: string, x: number, y: number, size = 2.6) => {
        context.font = `${size}px Arial`;
        context.fillText(value, x + 137, 69 - y);
      };
      context.fillRect(12, 9, 164, 3.1);
      context.fillStyle = "#222529";
      text("10MHz OUT", -43, 57, 2.8);
      context.fillStyle = "#c8cacc";
      for (const [x, number] of [
        [-95, "4"],
        [-55, "3"],
        [-15, "2"],
        [25, "1"],
      ] as const) {
        text(number, x, 42.5, 2.9);
      }
      text("MIN     MAX", 56, 34, 2.2);
      text("~ IN", 110, 62, 2.8);
      text("CAUTION", 72, 64, 3.2);
      text("RISK OF ELECTRIC SHOCK", 72, 61, 1.4);
      text("DO NOT OPEN", 72, 59, 1.4);
      text("APPARATEN SKALL ANSLUTAS", 120, 67, 1.35);
      text("TILL JORDAT UTTAG.", 120, 64.8, 1.35);
      text("SERIAL", 102, 18.5, 1.9);
      text("NO.", 100, 15.8, 1.9);
      context.fillRect(107 + 137, 50.4, 25, 3.5);
      context.strokeRect(60 + 137, 2.8, 24, 9);
      context.beginPath();
      context.moveTo(42 + 137, 9);
      context.lineTo(42 + 137, 53);
      context.moveTo(44 + 137, 16);
      context.lineTo(68 + 137, 16);
      context.quadraticCurveTo(71 + 137, 16, 71 + 137, 19);
      context.lineTo(71 + 137, 53);
      context.stroke();
      for (const [x, symbol] of [
        [55, "ϟ"],
        [90, "!"],
      ] as const) {
        context.beginPath();
        context.moveTo(x + 137, 2);
        context.lineTo(x + 131.5, 11.8);
        context.lineTo(x + 142.5, 11.8);
        context.closePath();
        context.fill();
        context.fillStyle = "#222529";
        context.font = "bold 6px Arial";
        context.fillText(symbol, x + 137, 10.5);
        context.fillStyle = "#c8cacc";
      }
      const sunX = 56 + 137;
      context.beginPath();
      context.arc(sunX, 23.5, 1.1, 0, Math.PI * 2);
      context.stroke();
      for (let index = 0; index < 12; index += 1) {
        const angle = (index / 12) * Math.PI * 2;
        context.beginPath();
        context.moveTo(
          sunX + Math.cos(angle) * 1.8,
          23.5 + Math.sin(angle) * 1.8
        );
        context.lineTo(
          sunX + Math.cos(angle) * 2.5,
          23.5 + Math.sin(angle) * 2.5
        );
        context.moveTo(sunX + Math.cos(angle) * 4, 41 + Math.sin(angle) * 4);
        context.lineTo(
          sunX + Math.cos(angle) * 5.3,
          41 + Math.sin(angle) * 5.3
        );
        context.stroke();
      }
      context.strokeRect(126 + 137, 28, 3, 5);
      context.beginPath();
      context.moveTo(124 + 137, 27);
      context.lineTo(131 + 137, 34);
      context.moveTo(131 + 137, 27);
      context.lineTo(124 + 137, 34);
      context.stroke();
    },
    "CG-10M rear-panel legends"
  );
}

export function createCg10mRear(parts: ModelParts) {
  const firstChild = parts.root.children.length;
  parts.box(
    [274, 56, 1.1],
    [0, 41, 0],
    parts.rear,
    "CG-10M black rear connection panel",
    0.3
  );
  parts.box(
    [274, 11.5, 1.7],
    [0, 75.3, -0.25],
    parts.silver,
    "Brushed rear upper rail",
    0.4
  );
  for (const x of [-95, -55, -15, 25]) {
    clockOutput(parts, x);
  }
  parts.cylinder(
    2.8,
    1.3,
    [56, 28, 1.4],
    parts.steel,
    "Meter brightness control seat"
  );
  parts.lathe(
    [
      [2.3, 0],
      [2.3, 3],
      [1.8, 3.3],
      [0, 3.3],
    ],
    [56, 28, 1.5],
    parts.turned,
    "Rear illumination potentiometer"
  );
  parts.box(
    [0.25, 2.5, 0.15],
    [56, 28, 4.88],
    parts.black,
    "Brightness control screwdriver slot",
    0.03
  );
  powerInlet(parts);
  rearLettering(parts);
  for (const [x, y] of [
    [-130, 43],
    [78, 26],
    [131, 43],
    [-49, 74],
    [51, 74],
  ] as const) {
    parts.screw([x, y, 1], "front", y < 69);
  }
  const group = new Group();
  group.name = "CG-10M rear connections";
  group.add(...parts.root.children.slice(firstChild));
  group.rotation.y = Math.PI;
  group.position.z = -112;
  parts.root.add(group);
}
