import { Box3, Group, Raycaster, Texture, Vector3 } from "three";
import type { Object3D } from "three";
import { afterEach, expect, it, vi } from "vite-plus/test";
import {
  createKantofHeadphoneStand,
  kantofCradleName,
  kantofStandPosition,
} from "./kantof-headphone-stand";
import { createSystemHeadphones } from "./system-headphones";

vi.mock(import("./prepared-textures"), () => ({
  createPreparedTexture: () => new Texture(),
}));

afterEach(() => vi.unstubAllGlobals());

function noop() {}

function smallestContactGap(cradle: Object3D, cushion: Object3D) {
  const [standX, , standZ] = kantofStandPosition;
  const downward = new Raycaster(new Vector3(), new Vector3(0, -1, 0));
  const upward = new Raycaster(new Vector3(), new Vector3(0, 1, 0));
  let gap = Infinity;
  for (const depth of [-10, 0, 10]) {
    for (let offset = -35; offset <= 35; offset += 2.5) {
      downward.ray.origin.set(standX + offset, 400, standZ + depth);
      upward.ray.origin.set(standX + offset, -200, standZ + depth);
      const [top] = downward.intersectObject(cradle);
      const [underside] = upward.intersectObject(cushion);
      if (top && underside) {
        gap = Math.min(gap, underside.point.y - top.point.y);
      }
    }
  }
  return gap;
}

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
    ellipse: noop,
    quadraticCurveTo: noop,
    closePath: noop,
    stroke: noop,
    fill: noop,
    fillRect: noop,
    strokeRect: noop,
    strokeText: noop,
    fillText: noop,
    putImageData: noop,
    measureText: (text: string) => ({ width: text.length }),
    createImageData: (width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
    }),
  };
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => context }),
  });
  vi.stubGlobal("Path2D", noop);
}

it("公表寸法の台座と木製アーチを備え、床から高さ290 mmに収める", () => {
  const stand = createKantofHeadphoneStand();
  const base = stand.group.getObjectByName("Black aluminium circular base");
  const cradle = stand.group.getObjectByName(kantofCradleName);
  if (!base || !cradle) {
    throw new Error("Missing headphone stand parts.");
  }
  const baseSize = new Box3().setFromObject(base).getSize(new Vector3());
  const cradleSize = new Box3().setFromObject(cradle).getSize(new Vector3());
  expect(baseSize.toArray()).toStrictEqual([
    expect.closeTo(120),
    expect.closeTo(8),
    expect.closeTo(120),
  ]);
  expect(cradleSize.x).toBeGreaterThan(99);
  expect(cradleSize.x).toBeLessThan(101);
  expect(cradleSize.z).toBeCloseTo(65);
  const bounds = new Box3().setFromObject(stand.group);
  expect(bounds.min.y).toBeCloseTo(0);
  expect(bounds.max.y).toBeCloseTo(290, 0);
  const top = (z: number) =>
    new Raycaster(
      new Vector3(0, 310, z),
      new Vector3(0, -1, 0)
    ).intersectObject(cradle)[0]?.point.y;
  for (const z of [-29, 29]) {
    expect(top(z)).toBeGreaterThan((top(0) ?? 0) + 2);
  }
  stand.dispose();
});

it("実際のヘッドバンドを木部に掛け、イヤホンは台座の手前に置く", async () => {
  stubCanvas();
  const stand = createKantofHeadphoneStand();
  stand.group.position.set(...kantofStandPosition);
  const headphones = createSystemHeadphones(
    new Group(),
    new Group(),
    stand.group
  );
  const cradle = stand.group.getObjectByName(kantofCradleName);
  if (!cradle) {
    throw new Error("Missing headphone cradle.");
  }
  for (const [selection, cushionName] of [
    ["hd-800s", "Rounded microfiber cushion beneath the headband"],
    ["clear-mg-pro", "Perforated red microfiber headband lining"],
  ] as const) {
    // oxlint-disable-next-line no-await-in-loop -- 選択を順番に切り替えて各表示状態を検証する。
    await headphones.setHeadphones(selection);
    const assembly = headphones.group.children.find((child) => child.visible);
    const cushion = assembly?.getObjectByName(cushionName);
    const model = assembly?.children[0];
    if (!(assembly && cushion && model)) {
      throw new Error(`Missing ${selection} headband.`);
    }
    stand.group.updateWorldMatrix(true, true);
    headphones.group.updateWorldMatrix(true, true);
    const gap = smallestContactGap(cradle, cushion);
    expect(gap).toBeGreaterThan(-0.2);
    expect(gap).toBeLessThan(0.2);
    expect(new Box3().setFromObject(model).min.y).toBeGreaterThan(0);
  }
  await headphones.setHeadphones("ie-600");
  const ie600 = headphones.group.children.find((child) => child.visible);
  const left = ie600?.getObjectByName("IE 600 Left earpiece");
  const right = ie600?.getObjectByName("IE 600 Right earpiece");
  if (!left || !right) {
    throw new Error("Missing IE 600 earpieces.");
  }
  const standBounds = new Box3().setFromObject(stand.group);
  for (const earpiece of [left, right]) {
    const bounds = new Box3().setFromObject(earpiece);
    expect(bounds.min.z).toBeGreaterThan(standBounds.max.z);
    expect(bounds.min.y).toBeGreaterThanOrEqual(0);
  }
  headphones.dispose();
  stand.dispose();
}, 15_000);
