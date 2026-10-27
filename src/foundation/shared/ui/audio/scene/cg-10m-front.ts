import { ExtrudeGeometry, Path, Shape } from "three";
import type { ModelParts } from "./parts";
import {
  createReferencePowerSwitch,
  referencePowerSwitchCutout,
} from "./reference-power-switch";
import { createTeacWordmark } from "./teac-wordmark";
import { cg10mMeter, createCg10mMeter } from "./cg-10m-meter";

const FRONT = cg10mMeter.front;
const METER_Y = cg10mMeter.y;

export function createCg10mFront(parts: ModelParts) {
  const plate = new Shape();
  plate.moveTo(-137, 12.5);
  plate.lineTo(137, 12.5);
  plate.lineTo(137, 80.5);
  plate.lineTo(-137, 80.5);
  plate.closePath();
  const meterHole = new Path();
  meterHole.absarc(0, METER_Y, 20.4, 0, Math.PI * 2, true);
  plate.holes.push(meterHole);
  plate.holes.push(referencePowerSwitchCutout());
  const geometry = new ExtrudeGeometry(plate, {
    depth: 3.2,
    bevelEnabled: true,
    bevelThickness: 0.3,
    bevelSize: 0.3,
    bevelSegments: 3,
    curveSegments: 32,
  });
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");
  for (let index = 0; index < positions.count; index += 1) {
    uvs.setXY(
      index,
      (positions.getX(index) + 137) / 274,
      (positions.getY(index) - 12.5) / 68
    );
  }
  parts.mesh(
    geometry,
    parts.silver,
    [0, 0, 111.5],
    "CG-10M machined front plate"
  );
  // メーターの面取りはノブの鏡面よりも落ち着いた金属光沢。
  const meterBezel = parts.turned.clone();
  meterBezel.roughness = 0.36;
  meterBezel.envMapIntensity = 0.75;
  parts.lathe(
    [
      [20.4, -3.4],
      [20.5, -0.45],
      [20.35, -0.05],
      [20, 0.05],
      [19.3, -0.2],
      [18.1, -1.2],
      [17.15, -2.4],
      [16.8, -3],
      [16.8, -5],
    ],
    [0, METER_Y, FRONT],
    meterBezel,
    "Flush machined meter bezel with a deep conical countersink"
  );
  parts.ring(
    16.85,
    0.18,
    [0, METER_Y, FRONT - 2.55],
    parts.black,
    "Recessed meter-glass gasket"
  );
  createCg10mMeter(parts);

  createReferencePowerSwitch(parts, "CG-10M");
  createTeacWordmark(parts, [-112, 69.8, FRONT + 0.02]);
  parts.print(
    274,
    68,
    [0, 46.5, FRONT + 0.45],
    (context) => {
      context.textAlign = "center";
      context.fillStyle = "#35383b";
      context.font = "2.2px Arial";
      context.fillText("POWER", 23, 26.5);
      context.font = "1.9px Arial";
      context.fillText("ON", 23, 30.8);
      context.fillText("OFF", 23, 55);
      context.font = "2.5px Arial";
      context.fillText("CG-10M", 256, 64);
    },
    "CG-10M front-panel silk-screen legends"
  );
}
