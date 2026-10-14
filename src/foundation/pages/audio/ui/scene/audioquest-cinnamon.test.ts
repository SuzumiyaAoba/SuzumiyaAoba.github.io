import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { expect, it } from "vitest";
import { cinnamonCableCurve } from "./audioquest-cinnamon";
import { cinnamonShieldGeometry } from "./cinnamon-geometry";

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
    new Vector3(type === "usb-a" ? 5.9 : 3.2, 0, -1),
    new Vector3(0, 0, 1)
  );
  expect(ray.intersectObject(shield).length).toBeGreaterThan(0);
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
