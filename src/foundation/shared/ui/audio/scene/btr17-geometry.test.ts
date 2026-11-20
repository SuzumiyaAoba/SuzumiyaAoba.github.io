import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { expect, it } from "vitest";
import { btr17KnobGeometry } from "./btr17-knob";
import {
  btr17Dimensions,
  btr17EndPlateGeometry,
  btr17FrameGeometry,
  btr17JackGeometry,
  btr17Outputs,
  btr17UsbPositions,
} from "./btr17-geometry";

it("少ない面で綾目の山と連続する斜め溝を実形状に残す", () => {
  const geometry = btr17KnobGeometry();
  const material = new MeshBasicMaterial();
  const knob = new Mesh(geometry, material);
  const radiusAt = (x: number, tooth: number) => {
    const angle = (tooth * Math.PI * 2) / 72;
    const direction = new Vector3(0, Math.cos(angle), Math.sin(angle));
    const origin = new Vector3(x, 0, 0).addScaledVector(direction, 8);
    const [hit] = new Raycaster(origin, direction.negate()).intersectObject(
      knob
    );
    return hit ? 8 - hit.distance : 0;
  };
  const bandCenter = 1.7 + (3.25 - 1.7) / 8;
  expect(radiusAt(bandCenter, 0.49)).toBeCloseTo(5.6, 2);
  expect(radiusAt(bandCenter, 0.01)).toBeCloseTo(5.47, 2);
  for (const fraction of [0.25, 0.6, 0.8]) {
    const phase = fraction * 2.2 * 1.15;
    const x = 3.275 + fraction * 2.175;
    expect(radiusAt(x, phase + 0.49)).toBeCloseTo(5.6, 2);
    expect(radiusAt(x, phase + 0.01)).toBeCloseTo(5.48, 2);
  }
  const corners =
    geometry.index?.count ?? geometry.getAttribute("position").count;
  expect(corners / 3).toBeLessThan(10_000);
  geometry.dispose();
  material.dispose();
});

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
  ray.set(new Vector3(-19, 65, 20), new Vector3(0, 0, -1));
  const [upper] = ray.intersectObject(frame);
  expect(lower?.face?.normal.z).toBeGreaterThan(0);
  expect(upper?.point.z).toBeCloseTo(7.4);
  expect(lower?.point.z).toBeCloseTo(8.15);
  ray.set(new Vector3(0, 65, 20), new Vector3(0, 0, -1));
  ray.far = 15;
  expect(ray.intersectObject(frame)).toHaveLength(0);
  ray.set(new Vector3(0, 62, -20), new Vector3(0, 0, 1));
  expect(ray.intersectObject(frame)).toHaveLength(0);
  ray.far = Number.POSITIVE_INFINITY;
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
