import { Group, Vector3 } from "three";
import type { Camera, Object3D } from "three";
import { createAudioquestCinnamon } from "./audioquest-cinnamon";
import { createCg10m } from "./cg-10m";
import { createCybershaftBnc } from "./cybershaft-bnc";
import { createHa1aMk2 } from "./ha-1a-mk2";
import { createNodeN130 } from "./node-n130";
import {
  cableEndpoint,
  createSystemCables,
  getConnectionPoint,
} from "./system-cables";
import { createSystemHeadphones } from "./system-headphones";
import { createUd505 } from "./ud-505";

function connectEquipment(
  node: Object3D,
  dac: Object3D,
  clock: Object3D,
  amp: Object3D
) {
  const cables = createSystemCables();
  const nodeRear = getConnectionPoint(node, "NODE N130 rear connections");
  const dacRear = getConnectionPoint(dac, "Rear connections");
  const clockRear = getConnectionPoint(clock, "CG-10M rear connections");
  const ampRear = getConnectionPoint(amp, "Rear connection panel");
  const usb = createAudioquestCinnamon(
    cableEndpoint(nodeRear, [27.5, 21.4, 2]),
    cableEndpoint(dacRear, [25.5, 54, 3]),
    { usbAFlipped: true }
  );
  cables.group.add(usb.group);
  const clockCable = createCybershaftBnc(
    cableEndpoint(clockRear, [25, 31.5, 10.1]),
    cableEndpoint(dacRear, [82, 32, 10.1])
  );
  cables.group.add(clockCable.group);
  for (const [channel, dacX, ampY, color, offset] of [
    ["L", -46.5, 180, 0xe0_dd_d3, 0],
    ["R", -78.5, 157, 0xaf_33_36, 13],
  ] as const) {
    cables.cable(
      `UD-505 LINE OUT ${channel} → HA-1A MK2 CD ${channel}`,
      cables.plug(
        cableEndpoint(dacRear, [dacX, 27, 8.5]),
        "rca",
        color,
        `UD-505 line output ${channel}`
      ),
      cables.plug(
        cableEndpoint(ampRear, [-29, ampY, 8.9]),
        "rca",
        color,
        `HA-1A MK2 CD input ${channel}`
      ),
      [
        new Vector3(-15, 45 + offset, -250 - offset),
        new Vector3(120, 55 + offset, -265 - offset),
      ]
    );
  }
  return {
    group: cables.group,
    dispose() {
      cables.dispose();
      usb.dispose();
      clockCable.dispose();
    },
  };
}

export function createAudioSystem() {
  const group = new Group();
  group.name = "Connected headphone audio system";
  const node = createNodeN130();
  const dac = createUd505();
  const clock = createCg10m();
  const amp = createHa1aMk2();
  node.group.position.x = -100;
  node.group.position.y += 169;
  dac.group.position.x = -100;
  clock.group.position.x = -100;
  clock.group.position.y += 84.5;
  amp.group.position.setX(160);
  amp.group.position.z = -10;
  group.add(node.group, dac.group, clock.group, amp.group);
  group.updateMatrixWorld(true);
  const equipmentCables = connectEquipment(
    node.group,
    dac.group,
    clock.group,
    amp.group
  );
  group.add(equipmentCables.group);

  const headphones = createSystemHeadphones(amp.group, dac.group);
  group.add(headphones.group);
  return {
    group,
    setHeadphones: headphones.setHeadphones,
    updateDetail(camera: Camera, viewportHeight: number) {
      const nodeChanged = node.updateDetail(camera, viewportHeight);
      const headphonesChanged = headphones.updateDetail(camera, viewportHeight);
      return nodeChanged || headphonesChanged;
    },
    dispose() {
      for (const model of [node, dac, clock, amp, headphones]) {
        model.dispose();
      }
      equipmentCables.dispose();
    },
  };
}
