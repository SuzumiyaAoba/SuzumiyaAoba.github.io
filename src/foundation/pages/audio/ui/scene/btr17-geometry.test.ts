import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { expect, it } from "vitest";
import {
  btr17Dimensions,
  btr17EndPlateGeometry,
  btr17FrameGeometry,
  btr17JackGeometry,
  btr17Outputs,
  btr17UsbPositions,
} from "./btr17-geometry";

it("公表寸法の筐体に前面の段差とノブの切り欠きを作る", () => {
  const geometry = btr17FrameGeometry();
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  expect(bounds?.getSize(new Vector3()).x).toBeCloseTo(btr17Dimensions.width);
  expect(bounds?.getSize(new Vector3()).y).toBeCloseTo(btr17Dimensions.height);
  expect(bounds?.getSize(new Vector3()).z).toBeCloseTo(btr17Dimensions.depth);
  const material = new MeshBasicMaterial();
  const frame = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, 25, 20), new Vector3(0, 0, -1));
  const [lower] = ray.intersectObject(frame);
  ray.set(new Vector3(0, 65, 20), new Vector3(0, 0, -1));
  const [upper] = ray.intersectObject(frame);
  expect(lower?.face?.normal.z).toBeGreaterThan(0);
  expect((lower?.point.z ?? 0) - (upper?.point.z ?? 0)).toBeGreaterThan(0.7);
  ray.set(new Vector3(18, 81, 20), new Vector3(0, 0, -1));
  expect(ray.intersectObject(frame)).toHaveLength(0);
  geometry.dispose();
  material.dispose();
});

it.each(btr17Outputs)("$label の端面とジャックを中央まで開ける", (output) => {
  const geometry = btr17EndPlateGeometry(true);
  const socketGeometry = btr17JackGeometry(output.bore, output.rim);
  const material = new MeshBasicMaterial();
  const panel = new Mesh(geometry, material);
  const socket = new Mesh(socketGeometry, material);
  socket.position.x = output.x;
  socket.updateMatrixWorld(true);
  const ray = new Raycaster(new Vector3(output.x, 3, 0), new Vector3(0, -1, 0));
  expect(ray.intersectObject(panel)).toHaveLength(0);
  expect(ray.intersectObject(socket)).toHaveLength(0);
  ray.set(new Vector3(8, 3, 3), new Vector3(0, -1, 0));
  expect(ray.intersectObject(panel)[0]?.face?.normal.y).toBeGreaterThan(0);
  geometry.dispose();
  socketGeometry.dispose();
  material.dispose();
});

it.each(btr17UsbPositions)("底面のUSB開口を金属で塞がない (%s)", (x) => {
  const geometry = btr17EndPlateGeometry(false);
  const material = new MeshBasicMaterial();
  const panel = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(x, -3, 0), new Vector3(0, 1, 0));
  expect(ray.intersectObject(panel)).toHaveLength(0);
  ray.set(new Vector3(x, -3, 3), new Vector3(0, 1, 0));
  expect(ray.intersectObject(panel)[0]?.face?.normal.y).toBeLessThan(0);
  geometry.dispose();
  material.dispose();
});
