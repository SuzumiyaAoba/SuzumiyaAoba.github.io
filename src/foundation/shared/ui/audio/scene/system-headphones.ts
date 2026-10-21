import { Group, Vector3 } from "three";
import type { Camera, Object3D } from "three";
import type {
  AudioScene,
  HeadphoneModel,
} from "@/shared/ui/audio/definitions/viewer";
import { createHd800s } from "./hd-800s";
import {
  cableEndpoint,
  createSystemCables,
  getConnectionPoint,
} from "./system-cables";
import type { CableEndpoint } from "./system-cables";

type HeadphoneScene = AudioScene;
const headphoneBuilders: Record<
  HeadphoneModel,
  () => Promise<() => HeadphoneScene>
> = {
  "hd-800s": async () => createHd800s,
  "clear-mg-pro": async () => (await import("./clear-mg-pro")).createClearMgPro,
  "ie-600": async () => {
    const { createIe600 } = await import("./ie-600");
    return () => createIe600({ standaloneCable: false });
  },
};

function headphoneEndpoint(
  cables: ReturnType<typeof createSystemCables>,
  model: Object3D,
  headphone: HeadphoneModel,
  side: "Left" | "Right"
): CableEndpoint {
  if (headphone === "ie-600") {
    return cableEndpoint(
      getConnectionPoint(model, `IE 600 ${side} cable exit`),
      [0, 0, 0]
    );
  }
  if (headphone === "hd-800s") {
    return cableEndpoint(
      getConnectionPoint(model, `HD 800 S ${side} cable exit`),
      [0, 0, 0]
    );
  }
  const cup = getConnectionPoint(
    model,
    `Clear Mg Professional ${side.toLowerCase()} ear cup`
  );
  return cables.plug(
    cableEndpoint(
      getConnectionPoint(cup, "Recessed detachable 3.5 mm cable socket"),
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

/** 未選択の形状・テクスチャ・配線は初回選択まで生成しない。 */
export function createSystemHeadphones(amp: Object3D, dac: Object3D) {
  const group = new Group();
  group.name = "Selectable headphones and their signal cables";
  const cache = new Map<HeadphoneModel, HeadphoneScene>();
  let active: HeadphoneScene | undefined;
  let disposed = false;
  let request = 0;
  let activeSelection: HeadphoneModel = "hd-800s";

  const createHeadphones = (
    selected: HeadphoneModel,
    build: () => HeadphoneScene
  ): HeadphoneScene => {
    const model = build();
    const assembly = new Group();
    assembly.name = `${selected} with connected cables`;
    model.group.position.x = 390;
    // HD 800 S の短いケーブルが床に埋まらない高さを維持する。
    model.group.position.y += selected === "hd-800s" ? 24 : 12;
    model.group.position.z = 25;
    assembly.add(model.group);
    group.add(assembly);
    group.updateWorldMatrix(true, true);
    try {
      const cables = connectHeadphones(model.group, amp, dac, selected);
      assembly.add(cables.group);
      return {
        group: assembly,
        updateDetail: (camera, viewportHeight) =>
          model.updateDetail?.(camera, viewportHeight) ?? false,
        dispose() {
          model.dispose();
          cables.dispose();
        },
      };
    } catch (error) {
      group.remove(assembly);
      model.dispose();
      throw error;
    }
  };

  const setHeadphones = async (nextModel: HeadphoneModel) => {
    if (disposed) {
      return;
    }
    request += 1;
    const version = request;
    if (nextModel === activeSelection) {
      return;
    }
    let next = cache.get(nextModel);
    if (!next) {
      const build = await headphoneBuilders[nextModel]();
      if (disposed || version !== request) {
        return;
      }
      next = createHeadphones(nextModel, build);
      cache.set(nextModel, next);
    }
    if (active === next) {
      return;
    }
    if (active) {
      active.group.visible = false;
    }
    next.group.visible = true;
    active = next;
    activeSelection = nextModel;
  };
  active = createHeadphones("hd-800s", createHd800s);
  cache.set("hd-800s", active);

  return {
    group,
    setHeadphones,
    updateDetail: (camera: Camera, viewportHeight: number) =>
      active?.updateDetail?.(camera, viewportHeight) ?? false,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      request += 1;
      for (const model of cache.values()) {
        model.dispose();
      }
      cache.clear();
      group.clear();
      active = undefined;
    },
  };
}
