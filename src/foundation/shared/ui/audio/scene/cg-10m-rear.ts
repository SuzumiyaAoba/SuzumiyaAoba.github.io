import {
  ExtrudeGeometry,
  Group,
  MeshPhysicalMaterial,
  Path,
  Shape,
} from "three";
import type { ModelParts } from "./parts";
import { powerInlet, powerInletCutout } from "./reference-power-inlet";
import { createBncSocket } from "./bnc-socket";

function clockOutput(parts: ModelParts, x: number) {
  const y = 31.5;
  createBncSocket(parts, [x, y, 0]);
  parts.screw([x + 8, y + 7, 1]);
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

function brightnessControl(parts: ModelParts) {
  const plastic = new MeshPhysicalMaterial({
    color: 0x0b_0d_10,
    roughness: 0.43,
    specularIntensity: 0.5,
  });
  parts.cylinder(
    2.9,
    0.8,
    [56, 28, 0.95],
    parts.black,
    "Illumination control mounting collar"
  );
  parts.lathe(
    [
      [2.5, 0],
      [2.5, 2.5],
      [2.3, 2.8],
      [0, 2.8],
    ],
    [56, 28, 1.4],
    plastic,
    "Black molded illumination-control shaft"
  );
  const top = new Shape();
  top.absarc(0, 0, 2.25, 0, Math.PI * 2, false);
  const slot = new Path();
  slot.moveTo(-0.28, -1.9);
  slot.lineTo(0.28, -1.9);
  slot.lineTo(0.28, 1.9);
  slot.lineTo(-0.28, 1.9);
  slot.closePath();
  top.holes.push(slot);
  parts.mesh(
    new ExtrudeGeometry(top, {
      depth: 0.5,
      bevelEnabled: true,
      bevelSize: 0.06,
      bevelThickness: 0.06,
      bevelSegments: 3,
      curveSegments: 32,
    }),
    plastic,
    [56, 28, 4.2],
    "Recessed screwdriver slot in the black brightness control"
  );
  parts.box(
    [0.56, 3.8, 0.1],
    [56, 28, 4.21],
    parts.cavity,
    "Dark floor inside the brightness-control slot",
    0.02
  );
}

export function createCg10mRear(parts: ModelParts) {
  const firstChild = parts.root.children.length;
  const panel = new Shape();
  panel.moveTo(-137, 13);
  panel.lineTo(137, 13);
  panel.lineTo(137, 69);
  panel.lineTo(-137, 69);
  panel.closePath();
  panel.holes.push(powerInletCutout());
  parts.mesh(
    new ExtrudeGeometry(panel, {
      depth: 1.1,
      bevelEnabled: true,
      bevelSize: 0.1,
      bevelThickness: 0.1,
      bevelSegments: 2,
    }),
    parts.rear,
    [0, 0, -0.55],
    "CG-10M black rear connection panel"
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
  brightnessControl(parts);
  powerInlet(parts);
  rearLettering(parts);
  for (const [x, y] of [
    [-130, 43],
    [78, 26],
    [131, 43],
    [-49, 74],
    [51, 74],
  ] as const) {
    parts.screw([x, y, 1]);
  }
  const group = new Group();
  group.name = "CG-10M rear connections";
  group.add(...parts.root.children.slice(firstChild));
  group.rotation.y = Math.PI;
  group.position.z = -112;
  parts.root.add(group);
}
