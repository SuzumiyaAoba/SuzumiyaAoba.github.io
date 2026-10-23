import {
  ExtrudeGeometry,
  Group,
  MeshStandardMaterial,
  Path,
  RingGeometry,
  Shape,
} from "three";
import { createHa1aPowerInlet } from "./ha-1a-power-inlet";
import { ha1aRearGeometry } from "./ha-1a-geometry";
import type { Ha1aParts } from "./ha-1a-parts";

function rca(
  parts: Ha1aParts,
  x: number,
  y: number,
  right: boolean,
  name: string
) {
  const insulator = new MeshStandardMaterial({
    color: right ? 0xac_22_22 : 0xe6_e1_d6,
    roughness: 0.65,
  });
  parts.cylinder(
    6.3,
    0.5,
    [x, y, 0.5],
    parts.black,
    `${name} insulating mounting washer`
  );
  const nut = new Shape();
  for (let corner = 0; corner <= 6; corner += 1) {
    const angle = (corner / 6) * Math.PI * 2;
    if (corner === 0) {
      nut.moveTo(Math.cos(angle) * 6.1, Math.sin(angle) * 6.1);
    } else {
      nut.lineTo(Math.cos(angle) * 6.1, Math.sin(angle) * 6.1);
    }
  }
  const bore = new Path();
  bore.absarc(0, 0, 3.1, 0, Math.PI * 2, true);
  nut.holes.push(bore);
  parts.mesh(
    new ExtrudeGeometry(nut, {
      depth: 1.6,
      bevelEnabled: true,
      bevelSize: 0.12,
      bevelThickness: 0.12,
      bevelSegments: 3,
      curveSegments: 32,
    }),
    parts.gold,
    [x, y, 0.4],
    `${name} hexagonal brass mounting nut with a through bore`
  );
  parts.lathe(
    [
      [4.8, 0],
      [4.8, 6.5],
      [4.3, 7.2],
      [3.2, 7.2],
      [3.2, 0],
    ],
    [x, y, 1.5],
    parts.gold,
    `${name} gold-plated RCA socket`
  );
  parts.lathe(
    [
      [3.2, 2],
      [3.2, 8.65],
    ],
    [x, y, 0],
    insulator,
    `${name} annular channel insulator`
  );
  parts.lathe(
    [
      [1.72, 8.65],
      [1.72, 2],
    ],
    [x, y, 0],
    insulator,
    `${name} inner insulating wall`
  );
  parts.mesh(
    new RingGeometry(1.72, 3.2, 64),
    insulator,
    [x, y, 8.65],
    `${name} flat colour-coded dielectric face`
  );
  parts.lathe(
    [
      [1.7, 2],
      [1.7, 8.6],
      [1.57, 8.8],
      [1.43, 8.5],
      [1.43, 2],
    ],
    [x, y, 0],
    parts.gold,
    `${name} hollow centre-contact sleeve`
  );
  parts.disc(
    1.44,
    [x, y, 1.9],
    parts.cavity,
    `${name} deep centre-contact floor`
  );
  for (const depth of [2.7, 3.2, 3.7]) {
    parts.ring(
      4.78,
      0.06,
      [x, y, depth],
      parts.gold,
      `${name} fine mounting thread`
    );
  }
}

function rearMarkings(parts: Ha1aParts) {
  parts.print(
    105,
    196,
    [0, 111, 0.3],
    (context) => {
      context.fillStyle = "#c5c7c9";
      context.strokeStyle = "#9b9da0";
      context.lineWidth = 0.3;
      context.textAlign = "center";
      const text = (value: string, x: number, y: number, size = 2.2) => {
        context.font = `${size}px Arial`;
        context.fillText(value, 52.5 + x, 98 - (y - 111));
      };
      text("INPUT", -16, 198);
      text("OUTPUT", 30, 198);
      text("CD", -29, 189);
      text("AUX", -7, 189);
      text("PRE-OUT", 30, 189);
      text("L", -44, 179);
      text("R", -44, 156);
      text("STEREO SOURCE", -9, 143, 1.8);
      context.strokeRect(13.5, 16, 48, 47);
      context.strokeRect(71.5, 16, 23, 47);
      text("AC INPUT", 0, 140);
      text("AC VOLTAGE", -32, 111, 1.4);
      text("~ 100–120V 50/60Hz 65W", 0, 137, 1.65);
      text("FUSE T1AL250V", 0, 96, 1.9);
      text("CAUTION", 0, 89, 2.2);
      text("RISK OF ELECTRIC SHOCK", 0, 85.5, 1.6);
      text("DO NOT OPEN", 0, 82.5, 1.6);
      context.strokeRect(29, 116.8, 47, 12);
      text("VACUUM TUBE HEADPHONE AMPLIFIER", 0, 76, 1.75);
      text("MODEL: HA-1A MK2", 0, 71.5, 2.2);
      text("SER. NO.:", -16, 66.5, 1.7);
      context.fillRect(44, 144.5, 28, 4.7);
      for (const x of [-31, 31]) {
        context.beginPath();
        context.moveTo(52.5 + x, 116.8);
        context.lineTo(47.5 + x, 128.8);
        context.lineTo(57.5 + x, 128.8);
        context.closePath();
        context.fill();
        context.fillStyle = "#222326";
        context.font = "7px Arial";
        context.fillText(x < 0 ? "ϟ" : "!", 52.5 + x, 127.2);
        context.fillStyle = "#c5c7c9";
      }
      text("ZHUHAI SPARK ELECTRONIC EQUIPMENT CO., LTD.", 0, 13, 1.75);
    },
    "Rear input, output and model identification labels"
  );
}

export function createHa1aRear(parts: Ha1aParts) {
  const start = parts.root.children.length;
  parts.mesh(
    ha1aRearGeometry(),
    parts.charcoal,
    [0, 111, -1.7],
    "Rear panel with ventilation slots and open IEC inlet"
  );
  for (const [x, name] of [
    [-29, "CD"],
    [-7, "AUX"],
    [30, "PRE-OUT"],
  ] as const) {
    rca(parts, x, 180, false, `${name} left`);
    rca(parts, x, 157, true, `${name} right`);
  }
  createHa1aPowerInlet(parts);
  rearMarkings(parts);
  for (const side of [-1, 1]) {
    for (const y of [27, 192]) {
      const ear = new Shape();
      ear.moveTo(-7.5, -6);
      ear.lineTo(1, -6);
      ear.absarc(1, 0, 6, -Math.PI / 2, Math.PI / 2, false);
      ear.lineTo(-7.5, 6);
      ear.closePath();
      const hole = new Path();
      hole.absarc(0, 0, 1.85, 0, Math.PI * 2, true);
      ear.holes.push(hole);
      const clamp = parts.mesh(
        new ExtrudeGeometry(ear, {
          depth: 0.7,
          bevelEnabled: true,
          bevelSize: 0.18,
          bevelThickness: 0.1,
          bevelSegments: 3,
          curveSegments: 32,
        }),
        parts.charcoal,
        [side * 48, y, 0.05],
        "Rounded rear-panel retaining clamp"
      );
      if (side > 0) {
        clamp.rotation.z = Math.PI;
      }
      parts.mesh(
        new RingGeometry(1.8, 2.65, 48),
        parts.steel,
        [side * 48, y, 0.89],
        "Rear-panel screw seating washer"
      );
      parts.screw([side * 48, y, 0.9], "front").scale.set(1.3, 1.3, 1.5);
    }
  }
  const rear = new Group();
  rear.name = "Rear connection panel";
  for (const child of parts.root.children.slice(start)) {
    rear.add(child);
  }
  rear.rotation.y = Math.PI;
  rear.position.z = -141.5;
  parts.root.add(rear);
}
