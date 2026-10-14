import { Group, Vector3 } from "three";
import type { Object3D } from "three";
import { headphoneModels } from "../../model/viewer";
import type { HeadphoneModel } from "../../model/viewer";
import { createAudioquestCinnamon } from "./audioquest-cinnamon";
import { createCg10m } from "./cg-10m";
import { createClearMgPro } from "./clear-mg-pro";
import { createCybershaftBnc } from "./cybershaft-bnc";
import { createHa1aMk2 } from "./ha-1a-mk2";
import { createHd800s } from "./hd-800s";
import { createIe600 } from "./ie-600";
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
  const usb = createAudioquestCinnamon(
    cableEndpoint(nodeRear, [27.5, 21.4, 2]),
    cableEndpoint(dacRear, [25.5, 54, 3])
  );
  cables.group.add(usb.group);
  const clockCable = createCybershaftBnc(
    cableEndpoint(clockRear, [25, 31.5, 8.5]),
    cableEndpoint(dacRear, [82, 32, 8.5])
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

function headphoneEndpoint(
  cables: ReturnType<typeof createSystemCables>,
  model: Object3D,
  headphone: HeadphoneModel,
  side: "Left" | "Right"
): CableEndpoint {
  if (headphone === "ie-600") {
    return cableEndpoint(
      namedPart(model, `IE 600 ${side} cable exit`),
      [0, 0, 0]
    );
  }
  if (headphone === "hd-800s") {
    return cableEndpoint(
      namedPart(model, `${side} ear cup`),
      [4, -129, 12],
      [0, -1, 0]
    );
  }
  const cup = namedPart(
    model,
    `Clear Mg Professional ${side.toLowerCase()} ear cup`
  );
  return cables.plug(
    cableEndpoint(
      namedPart(cup, "Recessed detachable 3.5 mm cable socket"),
      [0, 0, 0.6]
    ),
    "mini",
    side === "Left" ? 0xe0_dd_d3 : 0xaf_33_36,
    `Clear Mg ${side} 3.5 mm`
  );
}

function connectHeadphones(
  model: Object3D,
  amp: Object3D,
  dac: Object3D,
  headphone: HeadphoneModel
) {
  const cables = createSystemCables();
  const earphones = headphone === "ie-600";
  const plug = earphones
    ? cables.plug(
        cableEndpoint(dac, [25.5, 30.8, 115.9]),
        "balanced",
        0x56_57_55,
        "IE 600 4.4 mm balanced cable plug in UD-505"
      )
    : cables.plug(
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
    earphones
      ? "UD-505 4.4 mm balanced output → IE 600 Y split"
      : "HA-1A MK2 left jack → headphone Y split",
    plug,
    { position: junction.position, direction: new Vector3(0, 0, 1) },
    [new Vector3(earphones ? -35 : 150, 8, 235), new Vector3(245, 7, 275)],
    earphones ? 0.85 : 2.2
  );
  for (const side of ["Left", "Right"] as const) {
    const endpoint = headphoneEndpoint(cables, model, headphone, side);
    cables.cable(
      `${side} headphone cable`,
      junction,
      endpoint,
      [
        new Vector3(endpoint.position.x, 6, 145),
        new Vector3(endpoint.position.x + 12, 7, 70),
      ],
      earphones ? 0.6 : 1.5
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
    "ie-600": createIe600({ standaloneCable: false }),
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
  for (const id of headphoneModels) {
    const cables = connectHeadphones(
      headphones[id].group,
      amp.group,
      dac.group,
      id
    );
    headphoneCables.set(id, cables);
    group.add(cables.group);
  }
  const setHeadphones = (selected: HeadphoneModel) => {
    for (const id of headphoneModels) {
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
