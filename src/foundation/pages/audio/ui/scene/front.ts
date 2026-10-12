import { ExtrudeGeometry, Path, Shape } from "three";
import type { ModelParts } from "./parts";

const FRONT = 115;

function roundedPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): Shape {
  const shape = new Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function headphoneSocket(
  parts: ModelParts,
  x: number,
  y: number,
  radius: number
) {
  parts.lathe(
    [
      [radius + 2.4, 0],
      [radius + 2.4, 0.3],
      [radius + 1.3, 0.9],
      [radius, 0.9],
      [radius, -3],
    ],
    [x, y, FRONT],
    parts.turned,
    "Recessed headphone surround"
  );
  parts.disc(
    radius,
    [x, y, FRONT - 3.1],
    parts.cavity,
    "Headphone socket cavity"
  );
  parts.lathe(
    [
      [radius - 0.25, -2.8],
      [radius - 0.25, 0.35],
      [radius - 0.8, 0.35],
      [radius - 0.8, -2.8],
    ],
    [x, y, FRONT],
    parts.gold,
    "Gold-plated headphone sleeve"
  );
  parts.box(
    [0.65, 1.2, 1.1],
    [x + radius - 1.3, y, FRONT - 1.2],
    parts.gold,
    "Headphone spring contact",
    0.1
  );
}

function knob(
  parts: ModelParts,
  x: number,
  y: number,
  radius: number,
  depth: number,
  knurled: boolean
) {
  parts.cylinder(
    radius + 2.5,
    0.7,
    [x, y, FRONT + 0.2],
    parts.silver,
    "Counterbored dial seat"
  );
  parts.ring(
    radius + 0.7,
    0.35,
    [x, y, FRONT + 0.8],
    parts.cavity,
    "Dial clearance"
  );
  parts.lathe(
    [
      [radius - 1, 0],
      [radius, 1],
      [radius, depth - 2],
      [radius - 0.45, depth - 0.7],
      [radius - 1.1, depth],
      [0, depth],
    ],
    [x, y, FRONT + 1],
    parts.turned,
    knurled ? "Input selector" : "Volume control"
  );
  // Machined concentric circles and the fine grip on the input selector are geometry.
  for (let index = 0; index < 7; index += 1) {
    parts.ring(
      radius - 1.3 - index * 0.12,
      0.035,
      [x, y, FRONT + depth + 1.015],
      parts.steel,
      "Concentric machining"
    );
  }
  if (knurled) {
    for (let index = 0; index < 96; index += 1) {
      const angle = (index / 96) * Math.PI * 2;
      const grip = parts.box(
        [0.13, 0.13, 2],
        [
          x + Math.cos(angle) * radius,
          y + Math.sin(angle) * radius,
          FRONT + depth - 2.6,
        ],
        parts.steel,
        "Input dial knurl",
        0.02
      );
      grip.rotation.z = angle;
    }
  }
  // A radial specular texture reproduces the turned dial face without animated lighting.
  parts.print(
    radius * 2 - 2.3,
    radius * 2 - 2.3,
    [x, y, FRONT + depth + 1.04],
    (context) => {
      const r = radius - 1.15;
      context.save();
      context.translate(r, r);
      for (let index = 0; index < 360; index += 1) {
        const angle = (index / 360) * Math.PI * 2;
        const alpha = 0.035 + (Math.cos(angle * 2 + 0.9) + 1) * 0.08;
        context.fillStyle = `rgb(15 20 25 / ${alpha})`;
        context.beginPath();
        context.moveTo(0, 0);
        context.arc(0, 0, r, angle, angle + Math.PI / 180);
        context.closePath();
        context.fill();
      }
      context.restore();
    },
    "Turned dial face",
    512
  );
}

function frontLettering(parts: ModelParts) {
  parts.print(
    274,
    68,
    [0, 46.5, FRONT + 0.45],
    (context) => {
      context.fillStyle = "#35383b";
      context.textAlign = "center";
      const text = (value: string, x: number, y: number, size = 2.2) => {
        context.font = `${size}px Arial, sans-serif`;
        context.fillText(value, x + 137, 80.5 - y);
      };
      context.font = "bold 8px Georgia, serif";
      context.fillStyle = "#74777a";
      context.fillText("TEAC", 25, 13.5);
      context.fillStyle = "#35383b";
      text("POWER", -114, 54);
      text("ON", -114, 49.7, 1.9);
      text("OFF", -114, 25.5, 1.9);
      text("CLOCK", -90, 59);
      text("OPT/COAX", -90, 39);
      text("IN", -90, 36.5, 1.9);
      text("INPUT", -50.5, 62);
      text("PUSH ENTER", -50.5, 25.5, 1.9);
      text("MENU", -24, 62);
      text("PHONES", 25.5, 36.5);
      text("6.3 (L)", 0, 14.8);
      text("4.4", 25.5, 20.2);
      text("6.3 (R)", 50.7, 14.8);
      text("VOLUME", 99.5, 71);
      text("UD-505", 119, 16.5, 2.5);
      context.font = "5.7px Georgia, serif";
      context.fillText("DSD", 188, 10);
      text("Direct Stream Digital", 51, 68.5, 1.25);
    },
    "Front-panel silk-screen legends"
  );
}

export function createFront(parts: ModelParts) {
  const panel = roundedPath(-137, 12.5, 274, 68, 1.5);
  for (const [x, y, radius] of [
    [0, 27, 6.2],
    [25.5, 30.8, 3.7],
    [50.7, 27, 6.2],
    [-90, 31, 3.6],
  ] as const) {
    const hole = new Path();
    hole.absarc(x, y, radius, 0, Math.PI * 2, true);
    panel.holes.push(hole);
  }
  panel.holes.push(roundedPath(-10, 44.5, 71, 24, 3));
  panel.holes.push(roundedPath(-120, 29, 12, 20, 5.8));
  const plateGeometry = new ExtrudeGeometry(panel, {
    depth: 3.2,
    bevelEnabled: true,
    bevelThickness: 0.3,
    bevelSize: 0.3,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 16,
  });
  const positions = plateGeometry.getAttribute("position");
  const uvs = plateGeometry.getAttribute("uv");
  for (let index = 0; index < positions.count; index += 1) {
    uvs.setXY(
      index,
      (positions.getX(index) + 137) / 274,
      (positions.getY(index) - 12.5) / 68
    );
  }
  parts.mesh(
    plateGeometry,
    parts.silver,
    [0, 0, 111.5],
    "Machined aluminium front plate with through-holes"
  );

  parts.facePlate(
    [70.8, 23.8, 1.8],
    [25.5, 56.5, FRONT - 1.2],
    parts.steel,
    "Recessed display frame",
    2.8
  );
  parts.facePlate(
    [65.4, 18.4, 0.65],
    [25.5, 56.5, FRONT - 0.2],
    parts.glass,
    "OLED glass",
    1.6
  );
  parts.print(
    65.4,
    18.4,
    [25.5, 56.5, FRONT + 0.15],
    (context) => {
      context.fillStyle = "#8acacd";
      context.font = "7.5px monospace";
      context.textBaseline = "middle";
      context.fillText("USB", 9, 9.2);
    },
    "OLED input display",
    512
  );

  parts.facePlate(
    [11.7, 19.7, 1],
    [-114, 39, FRONT - 0.3],
    parts.steel,
    "Power switch bezel",
    5.5
  );
  parts.facePlate(
    [5.9, 12.2, 1.2],
    [-114, 38.2, FRONT + 0.3],
    parts.cavity,
    "Power switch opening",
    2.9
  );
  parts.cylinder(
    2.9,
    3.5,
    [-114, 40.4, FRONT + 2],
    parts.turned,
    "Power toggle"
  );
  parts.cylinder(
    1.65,
    0.8,
    [-90, 55.5, FRONT + 0.3],
    parts.steel,
    "Clock LED bezel"
  );
  parts.disc(1.15, [-90, 55.5, FRONT + 0.75], parts.blue, "Blue clock LED");
  parts.ring(
    4.1,
    0.6,
    [-90, 31, FRONT + 0.2],
    parts.steel,
    "Combined optical / coaxial input rim"
  );
  parts.disc(
    3.55,
    [-90, 31, FRONT - 2],
    parts.cavity,
    "Combined optical / coaxial input"
  );
  parts.cylinder(
    4.4,
    0.6,
    [-24, 55, FRONT + 0.2],
    parts.steel,
    "Menu button bezel"
  );
  parts.cylinder(3.4, 1.4, [-24, 55, FRONT + 0.8], parts.turned, "Menu button");
  parts.cylinder(
    3.9,
    0.5,
    [-24, 30.8, FRONT + 0.15],
    parts.black,
    "Infrared receiver bezel"
  );
  parts.disc(
    3.6,
    [-24, 30.8, FRONT + 0.43],
    parts.glass,
    "Infrared receiver window"
  );

  headphoneSocket(parts, 0, 27, 6.2);
  headphoneSocket(parts, 25.5, 30.8, 3.7);
  headphoneSocket(parts, 50.7, 27, 6.2);
  knob(parts, -50.5, 43, 10, 11.5, true);
  knob(parts, 99.5, 43.5, 19.5, 15.7, false);
  frontLettering(parts);
}
