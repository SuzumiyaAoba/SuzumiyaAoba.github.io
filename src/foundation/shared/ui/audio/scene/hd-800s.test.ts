import {
  Box3,
  Mesh,
  Material,
  MeshStandardMaterial,
  Raycaster,
  Texture,
  Vector3,
} from "three";
import { afterEach, expect, it, vi } from "vitest";
import { createHd800s } from "./hd-800s";

vi.mock(import("./prepared-textures"), () => ({
  createPreparedTexture: () => new Texture(),
}));
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
    closePath: noop,
    stroke: noop,
    fill: noop,
    fillRect: noop,
    strokeRect: noop,
    fillText: noop,
    measureText: (text: string) => ({ width: text.length }),
  };
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => context }),
  });
  vi.stubGlobal("Path2D", noop);
}

it("カップを内向きに傾けてもヨークの軸とバンドを分離させず、左右ケーブルを地面より上に保つ", () => {
  stubCanvas();
  const model = createHd800s();
  model.group.updateMatrixWorld(true);
  for (const [side, name] of [
    [-1, "Left"],
    [1, "Right"],
  ] as const) {
    const cup = model.group.getObjectByName(`${name} ear cup`);
    const cable = model.group.getObjectByName(`HD 800 S ${name} cable exit`);
    if (!cup || !cable) {
      throw new Error("Missing HD 800 S cup or cable anchor.");
    }
    const pivot = model.group.worldToLocal(
      cup.localToWorld(new Vector3(-9, 71, 11.5))
    );
    expect(pivot.x).toBeCloseTo(side * 97);
    expect(pivot.y).toBeCloseTo(143);
    expect(pivot.z).toBeCloseTo(0);
    const upper = cup.localToWorld(new Vector3(0, 45, -11.5));
    const lower = cup.localToWorld(new Vector3(0, -45, -11.5));
    expect(Math.abs(upper.x) - Math.abs(lower.x)).toBeGreaterThan(20);
    expect(cable.getWorldPosition(new Vector3()).y).toBeGreaterThan(0);
  }
  expect(new Box3().setFromObject(model.group).min.y).toBeCloseTo(0);
  model.dispose();
});

it("内側の支持枠を防塵布の後ろへ置き、黒い板で隠さない", () => {
  stubCanvas();
  const model = createHd800s();
  model.group.updateMatrixWorld(true);
  const cup = model.group.getObjectByName("Left ear cup");
  const driver = cup?.getObjectByName("Angled ring-radiator assembly");
  const cloth = driver?.getObjectByName("Inner driver protective mesh");
  if (
    !driver ||
    !(cloth instanceof Mesh) ||
    !(cloth.material instanceof MeshStandardMaterial)
  ) {
    throw new Error("Missing inner driver assembly.");
  }
  expect(cloth.material.transparent).toBe(true);
  expect(cloth.material.depthWrite).toBe(false);
  expect(cloth.position.z).toBeLessThan(-5.5);
  const ray = new Raycaster(
    driver.localToWorld(new Vector3(6, 0, -20)),
    new Vector3(0, 0, 1).transformDirection(driver.matrixWorld)
  );
  const hit = ray
    .intersectObject(model.group)
    .find(
      ({ object }) =>
        object instanceof Mesh &&
        object.material instanceof Material &&
        !object.material.transparent
    );
  expect(hit?.object.name).toBe(
    "Inner driver basket hub with absorber opening"
  );
  expect(
    driver.children.filter(
      (part) => part.name === "Swept twelve-spoke inner driver support"
    )
  ).toHaveLength(12);
  model.dispose();
});

it("左側の識別突起を三つだけ作り、パッドの縁と留め具を接続する", () => {
  stubCanvas();
  const model = createHd800s();
  const left = model.group.getObjectByName("Left ear cup");
  const right = model.group.getObjectByName("Right ear cup");
  expect(
    left?.children.filter(
      (part) => part.name === "Three tactile dots identifying the left ear cup"
    )
  ).toHaveLength(3);
  expect(
    right?.children.filter(
      (part) => part.name === "Three tactile dots identifying the left ear cup"
    )
  ).toHaveLength(0);
  const cushion = model.group.getObjectByName(
    "Rounded microfiber cushion beneath the headband"
  );
  if (!cushion) {
    throw new Error("Missing headband cushion.");
  }
  const cushionBounds = new Box3().setFromObject(cushion);
  const seams = model.group.children.filter(
    (part) => part.name === "Headband cushion edge binding"
  );
  for (const seam of seams) {
    const bounds = new Box3().setFromObject(seam);
    expect(cushionBounds.clone().expandByScalar(0.7).containsBox(bounds)).toBe(
      true
    );
  }
  model.dispose();
});
