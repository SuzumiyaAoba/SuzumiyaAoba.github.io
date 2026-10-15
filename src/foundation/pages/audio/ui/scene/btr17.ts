import {
  BoxGeometry,
  Matrix4,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector3,
} from "three";
import {
  btr17EndPlateGeometry,
  btr17FrameGeometry,
  btr17FrontGlassGeometry,
  btr17JackGeometry,
  btr17KnobGeometry,
  btr17Outputs,
  btr17RearLeatherGeometry,
  btr17UsbPositions,
  btr17UsbRimGeometry,
} from "./btr17-geometry";
import {
  btr17LeatherTexture,
  drawBtr17Display,
  drawBtr17SideLabels,
} from "./btr17-surface";
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
      [output.x, 81.9, 0],
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
  for (const x of btr17UsbPositions) {
    const charging = x > 0;
    const label = charging ? "POWER IN" : "USB";
    parts.mesh(
      btr17UsbRimGeometry(),
      charging ? parts.turned : parts.steel,
      [x, -0.03, 0],
      `${label} USB C metal shell`
    );
    parts.box(
      [8.2, 0.3, 2.5],
      [x, 2.6, 0],
      parts.cavity,
      `${label} dark port cavity`,
      0.3
    );
    parts.box(
      [6.3, 1.7, 0.6],
      [x, 1.75, 0],
      charging ? power : parts.black,
      `${label} recessed USB C tongue`,
      0.2
    );
    for (let contact = 0; contact < 12; contact += 1) {
      parts.box(
        [0.16, 0.85, 0.035],
        [x - 2.2 + contact * 0.4, 1.6, 0.315],
        parts.gold,
        `${label} USB contact`,
        0.01
      );
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
  const knobPosition = new Vector3(13.6, 81, 0);
  parts.mesh(
    btr17KnobGeometry(),
    metal,
    [13.6, 81, 0],
    "BTR17 pressable volume knob"
  );
  const count = 64 * 5 * 2;
  const knurl = parts.instanced(
    new BoxGeometry(0.56, 0.1, 0.22),
    metal,
    count,
    "Cross cut diamond knurl on the volume wheel"
  );
  const matrix = new Matrix4();
  const diagonal = new Matrix4();
  let instance = 0;
  for (let row = 0; row < 5; row += 1) {
    for (let index = 0; index < 64; index += 1) {
      const angle = ((index + (row % 2) / 2) / 64) * Math.PI * 2;
      for (const slope of [-1, 1]) {
        matrix.makeRotationX(angle);
        diagonal.makeRotationY((slope * Math.PI) / 4);
        matrix.multiply(diagonal);
        matrix.setPosition(
          knobPosition.x + 2.1 + row * 0.67,
          knobPosition.y + 5.63 * Math.cos(angle),
          5.63 * Math.sin(angle)
        );
        knurl.setMatrixAt(instance, matrix);
        instance += 1;
      }
    }
  }
  for (const radius of [3.9, 3.3]) {
    const ring = parts.ring(
      radius,
      0.12,
      [20.13, 81, 0],
      parts.turned,
      "Engraved concentric knob face"
    );
    ring.rotation.y = Math.PI / 2;
  }
  const center = parts.disc(
    3.05,
    [20.14, 81, 0],
    parts.rear,
    "Recessed volume wheel centre"
  );
  center.rotation.y = Math.PI / 2;
  for (const [y, name] of [
    [58.5, "Power"],
    [50.2, "Previous track and EQ"],
    [42, "Next track and pairing"],
  ] as const) {
    parts.box(
      [0.3, 3.7, 4.7],
      [20.56, y, 0],
      parts.cavity,
      `${name} button recess`,
      0.5
    );
    parts.box([0.8, 2.6, 3.7], [20.75, y, 0], metal, `${name} button`, 0.35);
  }
  parts.box(
    [0.2, 6.7, 3.8],
    [20.57, 32.5, 0],
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
    [0.2, 5.3, 3.8],
    [20.57, 21.3, 0],
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
    [20.64, 63.8, 0],
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
  const metal = new MeshPhysicalMaterial({
    color: 0x2e_32_38,
    metalness: 0.72,
    roughness: 0.4,
    clearcoat: 0.12,
    clearcoatRoughness: 0.55,
  });
  const front = new MeshPhysicalMaterial({
    color: 0x19_1c_20,
    metalness: 0.45,
    roughness: 0.5,
  });
  const glass = new MeshPhysicalMaterial({
    color: 0x03_05_08,
    metalness: 0.1,
    roughness: 0.16,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
  });
  const leatherTexture = btr17LeatherTexture();
  const leather = new MeshPhysicalMaterial({
    color: 0x1c_1e_21,
    roughness: 0.86,
    metalness: 0,
    bumpMap: leatherTexture,
    bumpScale: 0.16,
  });
  parts.mesh(
    btr17FrameGeometry(),
    metal,
    [0, 0, 0],
    "Chamfered aluminium chassis with recessed upper front"
  );
  const lower = parts.facePlate(
    [35.5, 38.4, 0.3],
    [0, 22.2, 8.24],
    front,
    "Satin black lower front panel",
    1.1
  );
  lower.userData["castShadow"] = false;
  parts.mesh(
    btr17FrontGlassGeometry(),
    glass,
    [0, 0, 7.42],
    "Recessed two section front glass panel"
  );
  parts.print(
    27,
    27,
    [-0.6, 60.2, 7.85],
    drawBtr17Display,
    "1.3 inch IPS display illustrative LDAC playback",
    1024
  );
  const back = parts.mesh(
    btr17RearLeatherGeometry(),
    leather,
    [0, 0, -8.49],
    "Grained black leather rear cover"
  );
  const logo = parts.print(
    18,
    8,
    [-0.5, 62, -8.59],
    (context) => {
      context.fillStyle = "#0d0f12";
      context.textAlign = "center";
      context.font = "bold 6px Arial";
      context.fillText("FiiO", 9, 6.3);
    },
    "FiiO debossed rear leather logo",
    1024
  );
  logo.rotation.y = Math.PI;
  back.userData["castShadow"] = false;
  createHeadphoneOutputs(parts);
  createUsbConnections(parts);
  createControls(parts, metal);
  return {
    group: parts.root,
    dispose() {
      parts.dispose();
      leatherTexture.dispose();
    },
  };
}
