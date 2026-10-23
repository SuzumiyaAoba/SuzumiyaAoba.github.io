import { Box3, Mesh, MeshPhysicalMaterial, Raycaster, Vector3 } from "three";
import type { Object3D } from "three";
import { afterEach, expect, it, vi } from "vitest";
import { createUd505 } from "./ud-505";
import { createCg10m } from "./cg-10m";

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
    bezierCurveTo: noop,
    quadraticCurveTo: noop,
    closePath: noop,
    stroke: noop,
    fill: noop,
    fillRect: noop,
    strokeRect: noop,
    fillText: noop,
    createRadialGradient: () => ({ addColorStop: noop }),
  };
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => context }),
  });
}

function visibleSurface(root: Object3D, origin: Vector3, direction: Vector3) {
  const ray = new Raycaster(
    root.localToWorld(origin),
    direction.transformDirection(root.matrixWorld)
  );
  return ray
    .intersectObject(root)
    .find((hit) => hit.object.userData["castShadow"] !== false);
}

it("ヘッドホン穴を筐体内部まで開け、操作部の周囲を前板より奥へ削り込む", () => {
  stubLetteringCanvas();
  const model = createUd505();
  model.group.updateMatrixWorld(true);
  for (const [x, y] of [
    [0, 27],
    [25.5, 30.8],
    [50.7, 27],
  ] as const) {
    const floor = visibleSurface(
      model.group,
      new Vector3(x, y, 160),
      new Vector3(0, 0, -1)
    );
    expect(floor?.object.name).toBe("Deep headphone socket floor");
    expect(floor && model.group.worldToLocal(floor.point).z).toBeCloseTo(102.4);
  }
  for (const [x, y, radius] of [
    [-50.5, 43, 12],
    [99.5, 43.5, 21],
    [0, 27, 7],
  ] as const) {
    const surround = visibleSurface(
      model.group,
      new Vector3(x + radius, y, 160),
      new Vector3(0, 0, -1)
    );
    expect(surround?.object.name).toBe(
      "Recessed machined control surround, flush with the front plate"
    );
    expect(surround && model.group.worldToLocal(surround.point).z).toBeLessThan(
      115
    );
  }
  model.dispose();
});

it("XLR、USB-B、サービス端子の奥を背面板や内部シールドで塞がない", () => {
  stubLetteringCanvas();
  const model = createUd505();
  model.group.updateMatrixWorld(true);
  const rear = model.group.getObjectByName("Rear connections");
  if (!rear) {
    throw new Error("Missing rear connections.");
  }
  for (const [x, y, name, z] of [
    [-105, 32, "Recessed XLR pin-carrier face", -6.55],
    [-21.5, 32, "Recessed XLR pin-carrier face", -6.55],
    [28.4, 53, "USB-B recessed socket", -8.81],
    [50.2, 24.5, "Service micro-USB deep cavity", -3.4],
  ] as const) {
    const ray = new Raycaster(
      rear.localToWorld(new Vector3(x, y, 30)),
      new Vector3(0, 0, -1).transformDirection(rear.matrixWorld)
    );
    const floor = ray
      .intersectObject(model.group)
      .find((hit) => hit.object.userData["castShadow"] !== false);
    expect(floor?.object.name).toBe(name);
    expect(floor && rear.worldToLocal(floor.point).z).toBeCloseTo(z, 1);
  }
  model.dispose();
});

it("共有電源入口に深い空洞と埋没しない刃状接点を保つ", () => {
  stubLetteringCanvas();
  for (const create of [createUd505, createCg10m]) {
    const model = create();
    model.group.updateMatrixWorld(true);
    const rear =
      model.group.getObjectByName("Rear connections") ??
      model.group.getObjectByName("CG-10M rear connections");
    if (!rear) {
      throw new Error("Missing rear panel.");
    }
    const ray = new Raycaster(
      rear.localToWorld(new Vector3(115, 42, 30)),
      new Vector3(0, 0, -1).transformDirection(rear.matrixWorld)
    );
    const floor = ray
      .intersectObject(model.group)
      .find((hit) => hit.object.userData["castShadow"] !== false);
    expect(floor?.object.name).toBe("IEC inlet cavity");
    expect(floor && rear.worldToLocal(floor.point).z).toBeCloseTo(-5.7);
    ray.ray.origin.copy(rear.localToWorld(new Vector3(111, 42, 30)));
    const contact = ray
      .intersectObject(model.group)
      .find((hit) => hit.object.userData["castShadow"] !== false);
    expect(contact?.object.name).toBe("Recessed IEC mains blade contact");
    model.dispose();
  }
});

it("表示をガラスより奥に置き、LED と公称寸法を保つ", () => {
  stubLetteringCanvas();
  const model = createUd505();
  model.group.updateMatrixWorld(true);
  const glass = model.group.getObjectByName(
    "Recessed polished OLED cover glass"
  );
  const display = model.group.getObjectByName(
    "OLED dot-matrix input indication beneath the cover glass"
  );
  if (
    !(glass instanceof Mesh) ||
    !(glass.material instanceof MeshPhysicalMaterial) ||
    !display
  ) {
    throw new Error("Missing OLED layers.");
  }
  expect(glass.material.transmission).toBe(1);
  expect(new Box3().setFromObject(glass).min.z).toBeGreaterThan(
    new Box3().setFromObject(display).max.z
  );
  const indicator = visibleSurface(
    model.group,
    new Vector3(-90, 55.5, 160),
    new Vector3(0, 0, -1)
  );
  expect(indicator?.object.name).toBe("Domed blue clock-lock indicator");
  const size = new Box3().setFromObject(model.group).getSize(new Vector3());
  expect(size.x).toBeCloseTo(290);
  expect(size.y).toBeCloseTo(84.5);
  expect(size.z).toBeCloseTo(248.7);
  model.dispose();
});

it("旋盤面と絶縁体の平面を重ねず、斜めから見たちらつきを防ぐ", () => {
  stubLetteringCanvas();
  const model = createUd505();
  model.group.updateMatrixWorld(true);
  const rear = model.group.getObjectByName("Rear connections");
  if (!rear) {
    throw new Error("Missing rear panel.");
  }
  for (const [parent, point, depth] of [
    [model.group, new Vector3(109.5, 47, 180), 130.7],
    [rear, new Vector3(-76.1, 54.5, 30), 5.95],
    [rear, new Vector3(84, 32.2, 30), 6.98],
  ] as const) {
    const ray = new Raycaster(
      parent.localToWorld(point),
      new Vector3(0, 0, -1).transformDirection(parent.matrixWorld)
    );
    const faces = ray
      .intersectObject(model.group)
      .filter(
        (hit) =>
          Math.abs(parent.worldToLocal(hit.point.clone()).z - depth) < 0.02
      );
    expect(faces).toHaveLength(1);
  }
  model.dispose();
});
