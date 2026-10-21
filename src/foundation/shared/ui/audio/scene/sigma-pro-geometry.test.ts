import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import type { BufferGeometry } from "three";
import { expect, it } from "vite-plus/test";
import {
  sigmaFrontGeometry,
  sigmaInputs,
  sigmaKnobGeometry,
  sigmaOutputs,
  sigmaRearGeometry,
  sigmaSideGeometry,
  sigmaTopGeometry,
} from "./sigma-pro-geometry";

function intersections(geometry: BufferGeometry, x: number, y: number) {
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const ray = new Raycaster(new Vector3(x, y, 10), new Vector3(0, 0, -1));
  const hits = ray.intersectObject(new Mesh(geometry, material));
  material.dispose();
  return hits;
}

it("keeps the glass window open to the circuit board while retaining its frame and controls", () => {
  const geometry = sigmaTopGeometry();
  expect(intersections(geometry, 0, 11)).toHaveLength(0);
  expect(intersections(geometry, 40.5, 11).length).toBeGreaterThan(0);
  expect(intersections(geometry, 0, -60).length).toBeGreaterThan(0);
  geometry.dispose();
});

it("opens the protective front slots through the side rails while retaining the rim", () => {
  const geometry = sigmaSideGeometry();
  expect(intersections(geometry, -72.6, 0)).toHaveLength(0);
  expect(intersections(geometry, -76.4, 0).length).toBeGreaterThan(0);
  expect(intersections(geometry, -72.6, 8.2).length).toBeGreaterThan(0);
  geometry.dispose();
});

it("opens every rear input through the panel while retaining the webs between them", () => {
  const geometry = sigmaRearGeometry();
  for (const { x, y } of sigmaInputs) {
    expect(intersections(geometry, x, y - 10)).toHaveLength(0);
  }
  expect(intersections(geometry, -25.5, 0).length).toBeGreaterThan(0);
  expect(intersections(geometry, 13, 0).length).toBeGreaterThan(0);
  geometry.dispose();
});

it("builds finite outward-facing surfaces for the recessed milling grooves", () => {
  const geometry = sigmaKnobGeometry();
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  let inwardNormals = 0;
  for (let index = 577; index < 1154; index += 1) {
    const radialDot =
      positions.getX(index) * normals.getX(index) +
      positions.getY(index) * normals.getY(index);
    expect(Number.isFinite(radialDot)).toBe(true);
    if (radialDot <= 0) {
      inwardNormals += 1;
    }
  }
  expect(inwardNormals).toBe(0);
  geometry.dispose();
});

it("bores all three headphone sockets through the front panel", () => {
  const geometry = sigmaFrontGeometry();
  for (const { x, y } of sigmaOutputs) {
    expect(intersections(geometry, x, y - 10)).toHaveLength(0);
  }
  expect(intersections(geometry, -19, -1.4).length).toBeGreaterThan(0);
  geometry.dispose();
});
