import {
  ExtrudeGeometry,
  MeshPhysicalMaterial,
  Path,
  Shape,
  SphereGeometry,
} from "three";
import { createUd505Controls, ud505CircularCutouts } from "./ud-505-controls";
import { createUd505Display } from "./ud-505-display";
import type { ModelParts } from "./parts";
import { createTeacWordmark } from "./teac-wordmark";
import {
  createReferencePowerSwitch,
  referencePowerSwitchCutout,
} from "./reference-power-switch";

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
  for (const [x, y, radius] of ud505CircularCutouts) {
    const hole = new Path();
    hole.absarc(x, y, radius, 0, Math.PI * 2, true);
    panel.holes.push(hole);
  }
  panel.holes.push(roundedPath(-10, 44.5, 71, 24, 3));
  panel.holes.push(referencePowerSwitchCutout());
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

  createUd505Display(parts);
  createUd505Controls(parts);

  createReferencePowerSwitch(parts, "UD-505");
  createTeacWordmark(parts, [-112, 69.8, FRONT + 0.02]);
  parts.cylinder(
    1.65,
    0.8,
    [-90, 55.5, FRONT + 0.3],
    parts.steel,
    "Clock LED bezel"
  );
  const lamp = parts.mesh(
    new SphereGeometry(1.1, 32, 16),
    new MeshPhysicalMaterial({
      color: 0x50_a9_f6,
      emissive: 0x28_6b_e8,
      emissiveIntensity: 0.8,
      roughness: 0.16,
      clearcoat: 1,
      toneMapped: false,
    }),
    [-90, 55.5, FRONT + 0.83],
    "Domed blue clock-lock indicator"
  );
  lamp.scale.z = 0.4;
  frontLettering(parts);
}
