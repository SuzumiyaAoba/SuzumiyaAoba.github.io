import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import type { BufferGeometry } from "three";
import { expect, it } from "vitest";
import {
  HA1A_WINDOW_Y,
  ha1aFrontGeometry,
  ha1aRearGeometry,
  ha1aTopGeometry,
} from "./ha-1a-geometry";

function intersections(geometry: BufferGeometry, x: number, y: number) {
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const mesh = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(x, y, 10), new Vector3(0, 0, -1));
  const hits = ray.intersectObject(mesh);
  material.dispose();
  return hits;
}

it("keeps the tube window open through the front panel while retaining its frame", () => {
  const geometry = ha1aFrontGeometry();
  const windowY = HA1A_WINDOW_Y - 111;
  expect(intersections(geometry, 0, windowY)).toHaveLength(0);
  expect(intersections(geometry, 50, windowY).length).toBeGreaterThan(0);
  geometry.dispose();
});

it("bores both headphone sockets through the aluminium front panel", () => {
  const geometry = ha1aFrontGeometry();
  expect(intersections(geometry, -36, -80)).toHaveLength(0);
  expect(intersections(geometry, 36, -80)).toHaveLength(0);
  expect(intersections(geometry, 0, -80).length).toBeGreaterThan(0);
  geometry.dispose();
});

it("leaves the top cooling slots open with solid webs between them", () => {
  const geometry = ha1aTopGeometry();
  expect(intersections(geometry, -28, 49)).toHaveLength(0);
  expect(intersections(geometry, 28, -49)).toHaveLength(0);
  expect(intersections(geometry, -28, 51).length).toBeGreaterThan(0);
  geometry.dispose();
});

it("opens the rear power inlet and ventilation slots without removing the centre web", () => {
  const geometry = ha1aRearGeometry();
  expect(intersections(geometry, 0, 7)).toHaveLength(0);
  expect(intersections(geometry, -17, -55)).toHaveLength(0);
  expect(intersections(geometry, 0, -55).length).toBeGreaterThan(0);
  geometry.dispose();
});
