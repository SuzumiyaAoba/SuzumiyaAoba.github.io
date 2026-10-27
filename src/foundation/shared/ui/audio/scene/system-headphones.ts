import { Group, Raycaster, Vector3 } from "three";
import type { Camera, Object3D } from "three";
import type {
  AudioScene,
  HeadphoneModel,
} from "@/shared/ui/audio/definitions/viewer";
import { createHd800s } from "./hd-800s";
import {
  kantofCradleName,
  kantofStandPosition,
} from "./kantof-headphone-stand";
import {
  cableEndpoint,
  createSystemCables,
  getConnectionPoint,
} from "./system-cables";
import type { CableEndpoint } from "./system-cables";

type HeadphoneScene = AudioScene & { connect?: (dac: Object3D) => AudioScene };
const headphoneBuilders: Record<
  HeadphoneModel,
  () => Promise<() => HeadphoneScene>
> = {
  "hd-800s": async () => createHd800s,
  "clear-mg-pro": async () => (await import("./clear-mg-pro")).createClearMgPro,
  "ie-600": async () => {
    const [{ createIe600 }, { createIe600SystemCable }] = await Promise.all([
      import("./ie-600"),
      import("./ie-600-system-cable"),
    ]);
    return () => {
      const model = createIe600({ standaloneCable: false });
      return {
        ...model,
        connect: (dac: Object3D) => createIe600SystemCable(model.group, dac),
      };
    };
  },
};

function headphoneEndpoint(
  cables: ReturnType<typeof createSystemCables>,
  model: Object3D,
  headphone: Exclude<HeadphoneModel, "ie-600">,
  side: "Left" | "Right"
): CableEndpoint {
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
  headphone: Exclude<HeadphoneModel, "ie-600">
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
    [new Vector3(150, 8, 235), new Vector3(245, 7, 275)],
    2.2
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
      1.5
    );
  }
  return cables;
}

function placeOnStand(
  model: Object3D,
  stand: Object3D,
  headphone: Exclude<HeadphoneModel, "ie-600">
) {
  const cradle = getConnectionPoint(stand, kantofCradleName);
  const cushionName =
    headphone === "hd-800s"
      ? "Rounded microfiber cushion beneath the headband"
      : "Perforated red microfiber headband lining";
  const cushion = getConnectionPoint(model, cushionName);
  stand.updateWorldMatrix(true, true);
  model.updateWorldMatrix(true, true);
  const center = stand.getWorldPosition(new Vector3());
  const downward = new Raycaster(new Vector3(), new Vector3(0, -1, 0));
  const upward = new Raycaster(new Vector3(), new Vector3(0, 1, 0));
  let lift = Number.NEGATIVE_INFINITY;
  // 接触位置を複数点で測り、中央が窪んだ HD 800 S も木部に埋めない。
  for (let offset = -35; offset <= 35; offset += 5) {
    downward.ray.origin.set(center.x + offset, center.y + 400, center.z);
    upward.ray.origin.set(center.x + offset, center.y - 200, center.z);
    const [top] = downward.intersectObject(cradle);
    const [underside] = upward.intersectObject(cushion);
    if (top && underside) {
      lift = Math.max(lift, top.point.y - underside.point.y);
    }
  }
  if (!Number.isFinite(lift)) {
    throw new TypeError(`Cannot place ${headphone} on the headphone stand.`);
  }
  model.position.y += lift + 0.1;
  model.updateWorldMatrix(true, true);
}

/** 未選択の形状・テクスチャ・配線は初回選択まで生成しない。 */
export function createSystemHeadphones(
  amp: Object3D,
  dac: Object3D,
  stand: Object3D
) {
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
    const [standX, , standZ] = kantofStandPosition;
    assembly.name = `${selected} with connected cables`;
    model.group.position.x = standX;
    model.group.position.z = selected === "ie-600" ? 150 : standZ;
    assembly.add(model.group);
    group.add(assembly);
    group.updateWorldMatrix(true, true);
    try {
      if (selected !== "ie-600") {
        placeOnStand(model.group, stand, selected);
      }
      const cables =
        selected === "ie-600"
          ? model.connect?.(dac)
          : connectHeadphones(model.group, amp, selected);
      if (!cables) {
        throw new Error("Missing IE 600 balanced cable builder.");
      }
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
