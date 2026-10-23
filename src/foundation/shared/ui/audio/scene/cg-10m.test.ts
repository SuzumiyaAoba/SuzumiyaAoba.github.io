import {
  Box3,
  Matrix3,
  Material,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Raycaster,
  Vector3,
} from "three";
import { afterEach, expect, it, vi } from "vitest";
import { createCg10m } from "./cg-10m";
import { bncContactGeometry } from "./bnc-socket";
import { createReferenceFeet } from "./reference-feet";
import { createReferenceParts } from "./reference-parts";

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

it("BNC の二分割ばね接点を中心穴と横のスリットで分離する", () => {
  const geometry = bncContactGeometry();
  const material = new MeshBasicMaterial();
  const contact = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, 0, 5), new Vector3(0, 0, -1));
  expect(ray.intersectObject(contact)).toHaveLength(0);
  ray.ray.origin.set(0.8, 0, 5);
  expect(ray.intersectObject(contact)).toHaveLength(0);
  ray.ray.origin.set(0.8, 0.25, 5);
  expect(ray.intersectObject(contact).length).toBeGreaterThan(0);
  geometry.dispose();
  material.dispose();
});

it("三点支持フットの底面工具穴を開け、旋盤仕上げの面と分離する", () => {
  const parts = createReferenceParts();
  createReferenceFeet(parts);
  parts.root.updateMatrixWorld(true);
  const ray = new Raycaster(new Vector3(-113.5, -5, 88), new Vector3(0, 1, 0));
  const [bore] = ray.intersectObject(parts.root);
  expect(bore?.object.name).toBe("Pin-point foot upper cup");
  expect(bore?.point.y).toBeCloseTo(5);
  ray.ray.origin.x = -94;
  const [end] = ray.intersectObject(parts.root);
  expect(end?.object.name).toBe(
    "Concentric machined underside of the pin-point foot"
  );
  parts.dispose();
});

it("ガラスと針を文字盤から離し、内部の筐体で表示を遮らない", () => {
  stubLetteringCanvas();
  const model = createCg10m();
  model.group.updateMatrixWorld(true);
  const lens = model.group.getObjectByName(
    "Convex meter glass with physical transmission and refraction"
  );
  const dial = model.group.getObjectByName(
    "Backlit graduated oven-status scale with printed ink"
  );
  if (
    !(lens instanceof Mesh) ||
    !(lens.material instanceof MeshPhysicalMaterial) ||
    !(dial instanceof Mesh) ||
    !(dial.material instanceof Material)
  ) {
    throw new Error("Missing physical meter components.");
  }
  expect(lens.material.transmission).toBeGreaterThan(0.95);
  expect(lens.userData["castShadow"]).toBe(false);
  expect(dial.material.transparent).toBe(false);
  expect(dial.material.alphaTest).toBeGreaterThan(0);
  const glassBounds = new Box3().setFromObject(lens);
  const dialBounds = new Box3().setFromObject(dial);
  expect(glassBounds.min.z - dialBounds.max.z).toBeGreaterThan(2);
  const origin = model.group.localToWorld(new Vector3(0, 53.5, 150));
  const ray = new Raycaster(origin, new Vector3(0, 0, -1));
  const visible = ray
    .intersectObject(model.group)
    .find(
      (hit) =>
        hit.object === dial ||
        (hit.object.userData["castShadow"] !== false && hit.object !== lens)
    );
  expect(visible?.object).toBe(dial);
  const [glass] = ray.intersectObject(lens);
  const worldNormal = glass?.normal
    ?.clone()
    .applyMatrix3(new Matrix3().getNormalMatrix(lens.matrixWorld))
    .normalize();
  expect(worldNormal?.z).toBeGreaterThan(0.95);
  expect(glass && lens.worldToLocal(glass.point.clone()).y).toBeGreaterThan(
    0.2
  );
  const size = new Box3().setFromObject(model.group).getSize(new Vector3());
  expect(size.x).toBeCloseTo(290);
  expect(size.y).toBeCloseTo(84.5);
  expect(size.z).toBeCloseTo(248.7);
  model.dispose();
});

it("天板と側板のねじを穴に収め、アルミの下へ埋没させない", () => {
  stubLetteringCanvas();
  const model = createCg10m();
  model.group.updateMatrixWorld(true);
  const ray = new Raycaster();
  for (const [position, direction] of [
    [
      [124.8, 100, 0.6],
      [0, -1, 0],
    ],
    [
      [160, 20.8, 72.6],
      [-1, 0, 0],
    ],
  ] as const) {
    ray.set(
      model.group.localToWorld(
        new Vector3(position[0], position[1], position[2])
      ),
      new Vector3(direction[0], direction[1], direction[2])
    );
    const [head] = ray.intersectObject(model.group);
    expect(head?.object.name).toBe(
      "Beveled screw head with a recessed Phillips drive"
    );
  }
  model.dispose();
});
