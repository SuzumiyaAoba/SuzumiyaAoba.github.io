import {
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  ShapeGeometry,
} from "three";
import {
  btr17EndPlateGeometry,
  btr17FrameGeometry,
  btr17FrontGlassGeometry,
  btr17FrontOutline,
  btr17JackGeometry,
  btr17Outputs,
  btr17RearLeatherGeometry,
  btr17UsbPositions,
  btr17UsbRimGeometry,
  btr17UsbLinerGeometry,
} from "./btr17-geometry";
import {
  btr17LeatherTexture,
  drawBtr17Display,
  drawBtr17Logo,
  drawBtr17SideLabels,
} from "./btr17-surface";
import { btr17KnobGeometry } from "./btr17-knob";
import { applySurfaceFinish } from "./surface-finish";
import { createModelParts } from "./parts";
import type { ModelParts } from "./parts";

function createHeadphoneOutputs(parts: ModelParts) {
  parts.mesh(
    btr17EndPlateGeometry(true),
    parts.rear,
    [0, 85.7, 0],
    "BTR17 top panel with open headphone sockets"
  );
  for (const output of btr17Outputs) {
    parts.mesh(
      btr17JackGeometry(output.bore, output.rim),
      parts.black,
      [output.x, 86.65, 0],
      `${output.label} recessed headphone socket`
    );
    for (const depth of [3.1, 7.8]) {
      parts.box(
        [0.22, 0.8, 0.65],
        [output.x + output.bore - 0.15, 86.4 - depth, 0],
        parts.gold,
        `${output.label} recessed jack spring contact`,
        0.06
      );
    }
    const rim = parts.ring(
      output.rim - 0.12,
      0.13,
      [output.x, 86.68, 0],
      parts.steel,
      `${output.label} headphone socket lip`
    );
    rim.rotation.x = -Math.PI / 2;
    const floor = parts.disc(
      output.bore,
      [output.x, 75.8, 0],
      parts.cavity,
      `${output.label} recessed socket floor`
    );
    floor.rotation.x = -Math.PI / 2;
  }
  const labels = parts.print(
    31,
    10,
    [-2.2, 86.73, 0],
    (context) => {
      context.fillStyle = "#b3b8bf";
      context.font = "1px Arial";
      context.fillText("BAL", 10.7, 5.3);
      context.fillText("PO", 21.3, 5.3);
    },
    "BAL and PO top panel legends",
    1024
  );
  labels.rotation.x = -Math.PI / 2;
}

function createUsbConnections(parts: ModelParts) {
  parts.mesh(
    btr17EndPlateGeometry(false),
    parts.rear,
    [0, 0, 0],
    "BTR17 bottom panel with two open USB C ports"
  );
  const power = new MeshStandardMaterial({ color: 0xb8_43_20, roughness: 0.7 });
  const shield = new MeshStandardMaterial({
    color: 0x45_49_4d,
    metalness: 0.75,
    roughness: 0.48,
    envMapIntensity: 0.5,
  });
  for (const x of btr17UsbPositions) {
    const charging = x > 0;
    const label = charging ? "POWER IN" : "USB";
    parts.mesh(
      btr17UsbRimGeometry(),
      shield,
      [x, -0.03, 0],
      `${label} USB C metal shell`
    );
    parts.mesh(
      btr17UsbLinerGeometry(),
      charging ? power : parts.black,
      [x, 0.03, 0],
      `${label} recessed moulded USB-C collar`
    );
    parts.box(
      [8.2, 0.3, 2.5],
      [x, 6.1, 0],
      parts.cavity,
      `${label} dark port cavity`,
      0.3
    );
    parts.box(
      [6.3, 4.8, 0.6],
      [x, 3.7, 0],
      charging ? power : parts.black,
      `${label} recessed USB C tongue`,
      0.2
    );
    for (const side of [-1, 1]) {
      for (let contact = 0; contact < 12; contact += 1) {
        parts.box(
          [0.16, 3.7, 0.035],
          [x - 2.2 + contact * 0.4, 3.2, side * 0.315],
          parts.gold,
          `${label} USB contact`,
          0.01
        );
      }
    }
  }
  const labels = parts.print(
    35,
    10,
    [0, -0.06, 0],
    (context) => {
      context.fillStyle = "#b3b8bf";
      context.textAlign = "center";
      context.font = "1px Arial";
      context.fillText("USB", 9.1, 2.5);
      context.fillText("POWER IN", 25.9, 2.5);
    },
    "USB and dedicated POWER IN legends",
    1024
  );
  labels.rotation.x = Math.PI / 2;
}

function createControls(parts: ModelParts, metal: MeshPhysicalMaterial) {
  parts.mesh(
    btr17KnobGeometry(),
    metal,
    [13.6, 81, 0],
    "BTR17 volume wheel with helical grooves and a diamond knurl band"
  );
  const face = parts.disc(
    4.25,
    [20.09, 81, 0],
    parts.turnedFace(),
    "Concentric turned metal volume wheel end disc"
  );
  face.rotation.y = Math.PI / 2;
  for (const [y, name] of [
    [58.5, "Power"],
    [50.2, "Previous track and EQ"],
    [42, "Next track and pairing"],
  ] as const) {
    parts.box(
      [0.3, 4.2, 5.2],
      [19.6, y, 0],
      parts.cavity,
      `${name} button recess`,
      0.5
    );
    parts.box([0.8, 2.6, 3.7], [20.75, y, 0], metal, `${name} button`, 0.35);
  }
  parts.box(
    [0.2, 7.2, 4.3],
    [19.6, 32.5, 0],
    parts.cavity,
    "PC BT PHONE selector slot",
    0.4
  );
  parts.box(
    [0.95, 1.8, 3.1],
    [20.82, 32.5, 0],
    parts.black,
    "Three position mode selector set to BT",
    0.25
  );
  parts.box(
    [0.2, 5.8, 4.3],
    [19.6, 21.3, 0],
    parts.cavity,
    "Desktop mode selector slot",
    0.4
  );
  const red = new MeshStandardMaterial({ color: 0xbb_32_22, roughness: 0.55 });
  parts.box(
    [0.25, 1.8, 2],
    [20.7, 20.3, 0],
    red,
    "Red desktop switch indicator",
    0.1
  );
  parts.box(
    [0.95, 1.8, 3.1],
    [20.82, 22.1, 0],
    parts.black,
    "D MODE slide switch",
    0.25
  );
  const microphone = parts.disc(
    0.32,
    [19.85, 63.8, 0],
    parts.cavity,
    "Side microphone aperture"
  );
  microphone.rotation.y = Math.PI / 2;
  const labels = parts.print(
    12,
    58,
    [20.65, 39, 0],
    drawBtr17SideLabels,
    "Side control icons and mode legends",
    768
  );
  labels.rotation.y = Math.PI / 2;
}

/** 公表外形寸法とメーカー写真を基準にしたブラックの外観モデル。細部寸法は推定。 */
export function createBtr17() {
  const parts = createModelParts({ brushed: false });
  parts.root.name = "FiiO BTR17 Black — millimetres";
  const metal = applySurfaceFinish(
    new MeshPhysicalMaterial({
      color: 0x25_28_2d,
      metalness: 0.72,
      roughness: 0.46,
      clearcoat: 0.12,
      clearcoatRoughness: 0.55,
    }),
    { scale: [24, 24, 24], relief: 0.0035, roughness: 0.055 }
  );
  const glass = new MeshPhysicalMaterial({
    color: 0xff_ff_ff,
    metalness: 0,
    roughness: 0.009,
    transmission: 1,
    thickness: 0.28,
    ior: 1.5,
    envMapIntensity: 0.6,
  });
  const leatherTexture = btr17LeatherTexture();
  const leather = new MeshPhysicalMaterial({
    color: 0x45_49_4f,
    roughness: 0.86,
    metalness: 0,
    map: leatherTexture.color,
    bumpMap: leatherTexture.height,
    bumpScale: 0.1,
  });
  parts.mesh(
    btr17FrameGeometry(),
    metal,
    [0, 0, 0],
    "Chamfered aluminium chassis with recessed upper front"
  );
  parts.mesh(
    new ShapeGeometry(btr17FrontOutline()),
    parts.cavity,
    [0, 0, 6.92],
    "Black IPS display backing beneath glass"
  );
  const cover = parts.mesh(
    btr17FrontGlassGeometry(),
    glass,
    [0, 0, 7.12],
    "Recessed physical front cover glass"
  );
  cover.userData["castShadow"] = false;
  const display = parts.print(
    23.4,
    23.4,
    [-0.6, 60.2, 6.98],
    drawBtr17Display,
    "1.3 inch IPS display illustrative LDAC playback",
    1024,
    true
  );
  display.material.transparent = false;
  display.material.depthWrite = true;
  parts.mesh(
    btr17RearLeatherGeometry(),
    leather,
    [0, 0, -7.98],
    "Grained black leather rear cover"
  );
  const logo = parts.print(
    18,
    8,
    [-0.5, 62, -8.065],
    (context) => {
      context.fillStyle = "#121416";
      drawBtr17Logo(context, 0, 2.28, 18, 3.44);
    },
    "FiiO debossed rear leather logo",
    1024
  );
  logo.rotation.y = Math.PI;
  createHeadphoneOutputs(parts);
  createUsbConnections(parts);
  createControls(parts, metal);
  return {
    group: parts.root,
    dispose() {
      parts.dispose();
      leatherTexture.height.dispose();
      leatherTexture.color.dispose();
    },
  };
}
