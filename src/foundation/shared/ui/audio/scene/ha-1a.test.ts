import { Box3, Mesh, MeshPhysicalMaterial, Raycaster, Vector3 } from "three";
import type { Object3D } from "three";
import { afterEach, expect, it, vi } from "vitest";
import { createHa1aMk2 } from "./ha-1a-mk2";
import { HA1A_FRONT } from "./ha-1a-geometry";

vi.mock(import("./prepared-textures"), async () => {
  const { Texture } = await import("three");
  return { createPreparedTexture: () => new Texture() };
});
afterEach(() => vi.unstubAllGlobals());

function noop() {}
function stubLetteringCanvas() {
  const context = {
    scale: noop,
    translate: noop,
    rotate: noop,
    save: noop,
    restore: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    ellipse: noop,
    quadraticCurveTo: noop,
    closePath: noop,
    stroke: noop,
    fill: noop,
    fillRect: noop,
    strokeRect: noop,
    fillText: noop,
  };
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => context }),
  });
}
function surface(root: Object3D, panel: Object3D, point: Vector3) {
  const ray = new Raycaster(
    panel.localToWorld(point),
    new Vector3(0, 0, -1).transformDirection(panel.matrixWorld)
  );
  return ray
    .intersectObject(root)
    .find((hit) => hit.object.userData["castShadow"] !== false);
}

it("正面ジャックと背面の RCA・IEC 入口を奥まで見通せる", () => {
  stubLetteringCanvas();
  const model = createHa1aMk2();
  model.group.updateMatrixWorld(true);
  for (const x of [-36, 36]) {
    const hit = surface(model.group, model.group, new Vector3(x, 31, 180));
    expect(hit?.object.name).toBe("Recessed headphone socket interior");
    expect(hit && model.group.worldToLocal(hit.point).z).toBeCloseTo(
      HA1A_FRONT - 12
    );
  }
  const rear = model.group.getObjectByName("Rear connection panel");
  if (!rear) {
    throw new Error("Missing Cayin rear panel.");
  }
  for (const [x, y, name, depth] of [
    [-29, 180, "CD left deep centre-contact floor", 1.9],
    [30, 157, "PRE-OUT right deep centre-contact floor", 1.9],
    [5, 123, "HA-1A IEC socket cavity floor", -7.7],
  ] as const) {
    const hit = surface(model.group, rear, new Vector3(x, y, 40));
    expect(hit?.object.name).toBe(name);
    expect(hit && rear.worldToLocal(hit.point).z).toBeCloseTo(depth);
  }
  model.dispose();
});

it("天板を前板の後ろで止め、木製側板の端面を金属と重ねない", () => {
  stubLetteringCanvas();
  const model = createHa1aMk2();
  const top = model.group.getObjectByName("Top cover with open cooling slots");
  const front = model.group.getObjectByName(
    "Brushed front panel with open tube window and headphone sockets"
  );
  const wood = model.group.getObjectByName("Lacquered wood side panel");
  const backing = model.group.getObjectByName(
    "Metal backing visible in the wood-panel seams"
  );
  if (!top || !front || !wood || !backing) {
    throw new Error("Missing enclosure layers.");
  }
  const gap =
    new Box3().setFromObject(front).min.z - new Box3().setFromObject(top).max.z;
  expect(gap).toBeGreaterThan(0);
  expect(gap).toBeLessThan(0.2);
  const woodBounds = new Box3().setFromObject(wood);
  const metalBounds = new Box3().setFromObject(backing);
  expect(woodBounds.min.z).toBeLessThan(metalBounds.min.z - 0.8);
  expect(woodBounds.max.z).toBeGreaterThan(metalBounds.max.z + 0.8);
  model.dispose();
});

it("五本の真空管に独立したガラス・ゲッター・ヒーターを設ける", () => {
  stubLetteringCanvas();
  const model = createHa1aMk2();
  const envelopes: Object3D[] = [];
  model.group.traverse((part) => {
    if (
      part instanceof Mesh &&
      part.name.endsWith("rounded glass envelope and evacuation tip")
    ) {
      envelopes.push(part);
    }
  });
  expect(envelopes).toHaveLength(5);
  for (const glass of envelopes) {
    if (
      !(glass instanceof Mesh) ||
      !(glass.material instanceof MeshPhysicalMaterial)
    ) {
      throw new Error("Missing physical tube glass.");
    }
    expect(glass.material.transmission).toBeGreaterThan(0.95);
    expect(glass.userData["castShadow"]).toBe(false);
    const name = glass.name.replace(
      " rounded glass envelope and evacuation tip",
      ""
    );
    const getter = model.group.getObjectByName(
      `${name} silver getter deposit following the glass shoulder`
    );
    const heater = model.group.getObjectByName(
      `${name} small glowing U-shaped heater`
    );
    expect(getter).toBeDefined();
    expect(heater).toBeDefined();
    if (!getter) {
      throw new Error("Missing getter deposit.");
    }
    const glassBounds = new Box3().setFromObject(glass);
    const getterBounds = new Box3().setFromObject(getter);
    expect(getterBounds.max.y).toBeLessThan(glassBounds.max.y);
    expect(getterBounds.min.x).toBeGreaterThan(glassBounds.min.x);
  }
  const size = new Box3().setFromObject(model.group).getSize(new Vector3());
  expect(size.x).toBeCloseTo(126.5);
  expect(size.y).toBeCloseTo(215);
  expect(size.z).toBeCloseTo(304);
  model.dispose();
});

it("木目の色を凹凸へ流用せず、ダイヤル端面を一枚だけにする", () => {
  stubLetteringCanvas();
  const model = createHa1aMk2();
  model.group.updateMatrixWorld(true);
  const wood = model.group.getObjectByName("Lacquered wood side panel");
  if (
    !(wood instanceof Mesh) ||
    !(wood.material instanceof MeshPhysicalMaterial)
  ) {
    throw new Error("Missing lacquered wood finish.");
  }
  expect(wood.material.map).not.toBe(wood.material.bumpMap);
  expect(wood.material.roughnessMap).not.toBe(wood.material.bumpMap);
  expect(wood.material.clearcoatRoughness).toBeLessThan(0.15);
  const ray = new Raycaster(
    model.group.localToWorld(new Vector3(5, 100, 180)),
    new Vector3(0, 0, -1)
  );
  const faces = ray
    .intersectObject(model.group)
    .filter(
      (hit) =>
        Math.abs(
          model.group.worldToLocal(hit.point.clone()).z - HA1A_FRONT - 14.1
        ) < 0.02
    );
  expect(faces).toHaveLength(1);
  model.dispose();
});
