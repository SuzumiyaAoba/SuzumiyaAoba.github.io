import { Box3, Mesh, MeshPhysicalMaterial, Raycaster, Vector3 } from "three";
import { afterEach, expect, it, vi } from "vitest";
import { createBtr17 } from "./btr17";
import { btr17Outputs, btr17UsbPositions } from "./btr17-geometry";
import type { Object3D } from "three";

afterEach(() => vi.unstubAllGlobals());

function noop() {}

function stubCanvas() {
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
    quadraticCurveTo: noop,
    closePath: noop,
    stroke: noop,
    fill: noop,
    fillRect: noop,
    strokeRect: noop,
    fillText: noop,
    putImageData: noop,
    createImageData: (width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
    }),
  };
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => context }),
  });
}

function surface(root: Object3D, origin: Vector3, direction: Vector3) {
  return new Raycaster(origin, direction)
    .intersectObject(root)
    .find((hit) => hit.object.userData["castShadow"] !== false);
}

it("両方のヘッドホン端子とUSB端子を深い接点まで開ける", () => {
  stubCanvas();
  const model = createBtr17();
  model.group.updateMatrixWorld(true);
  for (const output of btr17Outputs) {
    const floor = surface(
      model.group,
      new Vector3(output.x, 100, 0),
      new Vector3(0, -1, 0)
    );
    expect(floor?.object.name).toBe(`${output.label} recessed socket floor`);
    expect(floor?.point.y).toBeCloseTo(75.8);
  }
  for (const x of btr17UsbPositions) {
    const floor = surface(
      model.group,
      new Vector3(x, -15, 0.8),
      new Vector3(0, 1, 0)
    );
    expect(floor?.object.name).toBe(
      `${x > 0 ? "POWER IN" : "USB"} dark port cavity`
    );
    expect(floor?.point.y).toBeCloseTo(5.95);
  }
  model.dispose();
});

it("革を背面に埋め込み、各スイッチとマイクの周囲を側壁で埋めない", () => {
  stubCanvas();
  const model = createBtr17();
  model.group.updateMatrixWorld(true);
  const leather = surface(
    model.group,
    new Vector3(0, 62, -20),
    new Vector3(0, 0, 1)
  );
  expect(leather?.object.name).toBe("Grained black leather rear cover");
  expect(leather?.point.z).toBeCloseTo(-8.06);
  for (const [y, z, name] of [
    [60.1, 0, "Power button recess"],
    [30, 0, "PC BT PHONE selector slot"],
    [19.2, 0, "Desktop mode selector slot"],
    [63.8, 0, "Side microphone aperture"],
  ] as const) {
    const recess = surface(
      model.group,
      new Vector3(30, y, z),
      new Vector3(-1, 0, 0)
    );
    expect(recess?.object.name).toBe(name);
    expect(recess?.point.x).toBeLessThan(20);
  }
  model.dispose();
});

it("1.3インチの表示を透過ガラスの下に置き、ノブの端面を一枚だけにする", () => {
  stubCanvas();
  const model = createBtr17();
  model.group.updateMatrixWorld(true);
  const display = model.group.getObjectByName(
    "1.3 inch IPS display illustrative LDAC playback"
  );
  const glass = model.group.getObjectByName(
    "Recessed physical front cover glass"
  );
  if (
    !display ||
    !(glass instanceof Mesh) ||
    !(glass.material instanceof MeshPhysicalMaterial)
  ) {
    throw new Error("Missing BTR17 display layers.");
  }
  const displayBounds = new Box3().setFromObject(display);
  const size = displayBounds.getSize(new Vector3());
  expect(Math.hypot(size.x, size.y) / 25.4).toBeCloseTo(1.3, 1);
  expect(new Box3().setFromObject(glass).min.z).toBeGreaterThan(
    displayBounds.max.z
  );
  expect(glass.material.transmission).toBe(1);
  const ray = new Raycaster(
    new Vector3(30, 82, 0),
    new Vector3(-1, 0, 0),
    0,
    10
  );
  expect(ray.intersectObject(model.group)).toHaveLength(1);
  expect(ray.intersectObject(model.group)[0]?.object.name).toBe(
    "Concentric turned metal volume wheel end disc"
  );
  const bounds = new Box3().setFromObject(model.group).getSize(new Vector3());
  expect(bounds.z).toBeCloseTo(16.3);
  expect(bounds.y).toBeLessThan(86.9);
  expect(bounds.x).toBeLessThan(42);
  model.dispose();
});
