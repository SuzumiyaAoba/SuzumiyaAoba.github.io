import {
  BackSide,
  CylinderGeometry,
  RingGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { createSigmaSocket } from "./sigma-pro-sockets";
import type { SigmaParts } from "./sigma-pro-parts";
import {
  SIGMA_FRONT,
  SIGMA_KNOB_BORE,
  sigmaFrontGeometry,
  sigmaKnobGeometry,
  sigmaOutputs,
} from "./sigma-pro-geometry";

function knobSetScrew(parts: SigmaParts) {
  const direction = new Vector3(
    Math.cos(SIGMA_KNOB_BORE.angle),
    Math.sin(SIGMA_KNOB_BORE.angle),
    0
  );
  const center = new Vector3(27.5, 10, 67.8 + SIGMA_KNOB_BORE.z);
  const wallMaterial = parts.machined.clone();
  wallMaterial.side = BackSide;
  const wall = parts.mesh(
    new CylinderGeometry(1.02, 1.02, 1.8, 48, 1, true),
    wallMaterial,
    center.clone().addScaledVector(direction, 7.1).toArray(),
    "Radial volume-knob set-screw bore wall"
  );
  wall.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction);
  const rim = parts.mesh(
    new RingGeometry(1.02, 1.26, 64),
    parts.machined,
    center.clone().addScaledVector(direction, 8.03).toArray(),
    "Chamfered mouth of the radial knob set-screw bore"
  );
  rim.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), direction);
  const floor = parts.disc(
    1.025,
    center.clone().addScaledVector(direction, 6.2).toArray(),
    parts.cavity,
    "Deep volume-knob set-screw recess"
  );
  floor.quaternion.copy(rim.quaternion);
}

export function createSigmaFront(parts: SigmaParts) {
  parts.mesh(
    sigmaFrontGeometry(),
    parts.aluminium,
    [0, 10, SIGMA_FRONT - 0.87],
    "Headphone panel with three bored sockets and recessed volume-knob seat"
  );
  for (const { x, y, radius, bezel, label } of sigmaOutputs) {
    createSigmaSocket(
      parts,
      x,
      y,
      SIGMA_FRONT + 0.08,
      radius,
      bezel,
      label,
      label !== "6.35mm SE"
    );
  }
  parts.text(
    "SIGMA Pro",
    2.35,
    [-3, 16.9, SIGMA_FRONT + 0.12],
    "Solid laser-etched product name",
    parts.ink,
    "serif"
  );
  parts.text(
    "Portable DAC With Headphone Amplifier",
    0.9,
    [-3, 14.2, SIGMA_FRONT + 0.12],
    "Solid front-panel product subtitle",
    parts.ink,
    "sans",
    36
  );
  for (const { x, label } of sigmaOutputs) {
    parts.text(
      label,
      0.8,
      [x, 1.75, SIGMA_FRONT + 0.12],
      "Solid headphone output legends"
    );
  }
  parts.text(
    "VOL",
    0.8,
    [37, 1.75, SIGMA_FRONT + 0.12],
    "Solid volume control legend"
  );

  parts.cylinder(
    6.75,
    1.4,
    [27.5, 10, SIGMA_FRONT - 0.3],
    parts.insulator,
    "Recessed volume-knob bearing"
  );
  parts.mesh(
    sigmaKnobGeometry(),
    parts.aluminium,
    [27.5, 10, 67.8],
    "Volume knob with 72 helical milling grooves and an open set-screw bore"
  );
  knobSetScrew(parts);
  parts.lathe(
    [
      [7.45, -0.18],
      [7.65, 0],
      [7.52, 0.15],
      [7.1, 0.19],
    ],
    [27.5, 10, 77.2],
    parts.machined,
    "Turned and bevelled knob end ring"
  );
  parts.disc(
    7.1,
    [27.5, 10, 77.38],
    parts.aluminium,
    "Inset flat volume-knob face"
  );
  const arc = (Math.PI * 2) / 3 - 0.045;
  for (let index = 0; index < 3; index += 1) {
    const lip = parts.mesh(
      new TorusGeometry(7.28, 0.13, 10, 96, arc),
      parts.machined,
      [27.5, 10, 77.42],
      "Polished front lip with three machining breaks"
    );
    lip.rotation.z = (index * Math.PI * 2) / 3 + 0.025;
  }
}
