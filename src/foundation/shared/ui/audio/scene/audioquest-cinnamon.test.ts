import { Box3, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { afterEach, expect, it, vi } from "vitest";
import {
  cinnamonCableCurve,
  createStandaloneCinnamon,
} from "./audioquest-cinnamon";
import {
  cinnamonShieldGeometry,
  cinnamonHousingGeometry,
  cinnamonMarkGeometry,
} from "./cinnamon-geometry";

afterEach(() => vi.unstubAllGlobals());

function noop() {}

it("1.5 m の余長を巻いても機器の接続位置と向きを保つ", () => {
  const start = {
    position: new Vector3(-127.5, 190.4, -143.5),
    direction: new Vector3(0, 0, -1),
  };
  const end = {
    position: new Vector3(-125.5, 54, -144.5),
    direction: new Vector3(0, 0, -1),
  };
  const curve = cinnamonCableCurve(start, end);
  expect(curve.getLength()).toBeCloseTo(1500, 2);
  expect(curve.getPoint(0).distanceTo(start.position)).toBeLessThan(0.001);
  expect(curve.getPoint(1).distanceTo(end.position)).toBeLessThan(0.001);
  expect(curve.getTangent(0).dot(start.direction)).toBeGreaterThan(0.99);
  expect(curve.getTangent(1).dot(end.direction)).toBeLessThan(-0.99);
  expect(start.position.toArray()).toStrictEqual([-127.5, 190.4, -143.5]);
  expect(end.position.toArray()).toStrictEqual([-125.5, 54, -144.5]);
});

it.each(["usb-a", "usb-b"] as const)("%s の金属シェルを中空にする", (type) => {
  const geometry = cinnamonShieldGeometry(type);
  const material = new MeshBasicMaterial();
  const shield = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, 0, -1), new Vector3(0, 0, 1));
  expect(ray.intersectObject(shield)).toHaveLength(0);
  ray.set(
    new Vector3(type === "usb-a" ? 5.9 : 3.9, 0, -1),
    new Vector3(0, 0, 1)
  );
  expect(ray.intersectObject(shield).length).toBeGreaterThan(0);
  geometry.dispose();
  material.dispose();
});

it("USB-A の保持穴を上下とも開け、穴の間の金属板を残す", () => {
  const geometry = cinnamonShieldGeometry("usb-a");
  const material = new MeshBasicMaterial();
  const shield = new Mesh(geometry, material);
  for (const side of [-1, 1]) {
    for (const x of [-2.6, 2.6]) {
      const ray = new Raycaster(
        new Vector3(x, side * 5, 5.8),
        new Vector3(0, -side, 0),
        0,
        4
      );
      expect(ray.intersectObject(shield)).toHaveLength(0);
      ray.ray.origin.x = 0;
      expect(ray.intersectObject(shield).length).toBeGreaterThan(0);
    }
  }
  geometry.dispose();
  material.dispose();
});

it("巻いた USB ケーブルを床面に埋めない", () => {
  const curve = cinnamonCableCurve(
    {
      position: new Vector3(-127.5, 190.4, -143.5),
      direction: new Vector3(0, 0, -1),
    },
    {
      position: new Vector3(-125.5, 54, -144.5),
      direction: new Vector3(0, 0, -1),
    }
  );
  const lowest = Math.min(...curve.getPoints(2048).map((point) => point.y));
  expect(lowest).toBeGreaterThanOrEqual(3.1);
});

it.each(["usb-a", "usb-b"] as const)(
  "%s の印字を曲面に密着させ、ブーツを円形のケーブルへつなぐ",
  (type) => {
    const cover = new Mesh(
      cinnamonHousingGeometry(type, "cover"),
      new MeshBasicMaterial()
    );
    const mark = cinnamonMarkGeometry(type);
    const positions = mark.getAttribute("position");
    for (let index = 0; index < positions.count; index += 41) {
      const point = new Vector3().fromBufferAttribute(positions, index);
      const ray = new Raycaster(point, new Vector3(0, -1, 0));
      expect(ray.intersectObject(cover)[0]?.distance).toBeCloseTo(0.014, 2);
    }
    const boot = cinnamonHousingGeometry(type, "boot");
    const points = boot.getAttribute("position");
    const radii: number[] = [];
    for (let index = 0; index < points.count; index += 1) {
      if (
        points.getZ(index) === 40 &&
        Math.hypot(points.getX(index), points.getY(index)) > 1
      ) {
        radii.push(Math.hypot(points.getX(index), points.getY(index)));
      }
    }
    expect(radii.length).toBeGreaterThan(100);
    for (const radius of radii) {
      expect(radius).toBeCloseTo(3.1, 5);
    }
    cover.geometry.dispose();
    cover.material.dispose();
    mark.dispose();
    boot.dispose();
  }
);

it("接点を金属シールドの内側へ収め、中空のB端子を奥まで見通せる", () => {
  const context = {
    scale: noop,
    translate: noop,
    fillText: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    closePath: noop,
    fill: noop,
    arc: noop,
    fillRect: noop,
  };
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => context }),
  });
  const model = createStandaloneCinnamon();
  model.group.updateMatrixWorld(true);
  const plug = model.group.getObjectByName("AudioQuest Cinnamon USB-B plug");
  if (!plug) {
    throw new Error("Missing USB-B plug.");
  }
  const ray = new Raycaster(
    plug.localToWorld(new Vector3(0, 0, -1)),
    new Vector3(0, 0, 1).transformDirection(plug.matrixWorld)
  );
  const [hit] = ray.intersectObject(plug);
  expect(hit?.object.name).toBe("USB-B recessed contact floor");
  expect(hit?.distance).toBeCloseTo(11.8, 1);
  expect(new Box3().setFromObject(model.group).min.y).toBeGreaterThanOrEqual(0);
  model.dispose();
});

it.each([
  [
    [-35, 14, 131.5],
    [25, 14, 131.5],
  ],
  [
    [-127.5, 190.4, -143.5],
    [-125.5, 54, -144.5],
  ],
])("床面に二巻きしたケーブル同士が交差部分で食い込まない: %j", (start, end) => {
  const curve = cinnamonCableCurve(
    { position: new Vector3(...start), direction: new Vector3(0, 0, -1) },
    { position: new Vector3(...end), direction: new Vector3(0, 0, -1) }
  );
  const points = curve.getSpacedPoints(600);
  let closest = Infinity;
  let pair = [0, 0];
  for (const [first, point] of points.entries()) {
    for (const [offset, other] of points.slice(first + 8).entries()) {
      const second = first + 8 + offset;
      const distance = point.distanceTo(other);
      if (distance < closest) {
        closest = distance;
        pair = [first, second];
      }
    }
  }
  expect(
    closest,
    JSON.stringify({
      pair,
      points: pair.map((index) => points[index]?.toArray()),
    })
  ).toBeGreaterThanOrEqual(6.2);
});
