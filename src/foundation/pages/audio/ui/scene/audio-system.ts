import { Group, Vector3 } from "three";
import type { Object3D } from "three";
import type { HeadphoneModel } from "../viewer-types";
import { createCg10m } from "./cg-10m";
import { createClearMgPro } from "./clear-mg-pro";
import { createHa1aMk2 } from "./ha-1a-mk2";
import { createHd800s } from "./hd-800s";
import { createNodeN130 } from "./node-n130";
import { cableEndpoint, createSystemCables } from "./system-cables";
import type { CableEndpoint } from "./system-cables";
import { createUd505 } from "./ud-505";

function namedPart(model: Object3D, name: string): Object3D {
  const part = model.getObjectByName(name);
  if (!part) {
    throw new Error(`Audio connection point is missing: ${name}`);
  }
  return part;
}

function connectEquipment(
  node: Object3D,
  dac: Object3D,
  clock: Object3D,
  amp: Object3D
) {
  const cables = createSystemCables();
  const nodeRear = namedPart(node, "NODE N130 rear connections");
  const dacRear = namedPart(dac, "Rear connections");
  const clockRear = namedPart(clock, "CG-10M rear connections");
  const ampRear = namedPart(amp, "Rear connection panel");
  cables.cable(
    "NODE USB-A → UD-505 USB-B",
    cables.usbPlug(
      cableEndpoint(nodeRear, [27.5, 21.4, 2]),
      "usb-a",
      "NODE USB-A output"
    ),
    cables.usbPlug(
      cableEndpoint(dacRear, [25.5, 54, 3]),
      "usb-b",
      "UD-505 USB-B input"
    ),
    [new Vector3(-145, 140, -245), new Vector3(-205, 68, -250)]
  );
  cables.cable(
    "CG-10M 10 MHz OUT 1 → UD-505 CLOCK SYNC IN",
    cables.plug(
      cableEndpoint(clockRear, [25, 31.5, 8.5]),
      "bnc",
      0xb9_91_4e,
      "CG-10M clock output 1"
    ),
    cables.plug(
      cableEndpoint(dacRear, [82, 32, 8.5]),
      "bnc",
      0xb9_91_4e,
      "UD-505 10 MHz input"
    ),
    [new Vector3(-150, 18, -285), new Vector3(-245, 72, -290)]
  );
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
  return cables;
}

function connectHeadphones(
  model: Object3D,
  amp: Object3D,
  headphone: HeadphoneModel
) {
  const cables = createSystemCables();
  const plug = cables.plug(
    cableEndpoint(amp, [-36, 31, 142.2]),
    "headphone",
    0x9d_a3_aa,
    "HA-1A MK2 left PHONES A 6.35 mm"
  );
  const junction: CableEndpoint = {
    position: new Vector3(295, 10, 220),
    direction: new Vector3(0, 0, -1),
  };
  cables.cable(
    "HA-1A MK2 left jack → headphone Y split",
    plug,
    { position: junction.position, direction: new Vector3(0, 0, 1) },
    [new Vector3(150, 8, 235), new Vector3(245, 7, 275)]
  );
  for (const side of ["Left", "Right"]) {
    const cup = namedPart(
      model,
      headphone === "hd-800s"
        ? `${side} ear cup`
        : `Clear Mg Professional ${side.toLowerCase()} ear cup`
    );
    const endpoint =
      headphone === "hd-800s"
        ? cableEndpoint(cup, [4, -129, 12], [0, -1, 0])
        : cables.plug(
            cableEndpoint(
              namedPart(cup, "Recessed detachable 3.5 mm cable socket"),
              [0, 0, 0.6]
            ),
            "mini",
            side === "Left" ? 0xe0_dd_d3 : 0xaf_33_36,
            `Clear Mg ${side} 3.5 mm`
          );
    cables.cable(
      `${side} headphone cable`,
      junction,
      endpoint,
      [
        new Vector3(endpoint.position.x, 6, 145),
        new Vector3(endpoint.position.x + 12, 7, 70),
      ],
      1.5
    );
  }
  return cables;
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

  const headphones = {
    "hd-800s": createHd800s(),
    "clear-mg-pro": createClearMgPro(),
  };
  const headphoneCables = new Map<
    HeadphoneModel,
    ReturnType<typeof createSystemCables>
  >();
  for (const [id, model] of Object.entries(headphones)) {
    model.group.position.x = 390;
    // 既存の短いケーブルが床に埋まらないよう、HD 800 S を持ち上げる。
    model.group.position.y += id === "hd-800s" ? 24 : 12;
    model.group.position.z = 25;
    group.add(model.group);
  }
  group.updateMatrixWorld(true);
  for (const id of ["hd-800s", "clear-mg-pro"] as const) {
    const cables = connectHeadphones(headphones[id].group, amp.group, id);
    headphoneCables.set(id, cables);
    group.add(cables.group);
  }
  const setHeadphones = (selected: HeadphoneModel) => {
    for (const id of ["hd-800s", "clear-mg-pro"] as const) {
      headphones[id].group.visible = id === selected;
      const cables = headphoneCables.get(id);
      if (cables) {
        cables.group.visible = id === selected;
      }
    }
  };
  setHeadphones("hd-800s");
  return {
    group,
    setHeadphones,
    dispose() {
      for (const model of [
        node,
        dac,
        clock,
        amp,
        ...Object.values(headphones),
      ]) {
        model.dispose();
      }
      equipmentCables.dispose();
      for (const cables of headphoneCables.values()) {
        cables.dispose();
      }
    },
  };
}
