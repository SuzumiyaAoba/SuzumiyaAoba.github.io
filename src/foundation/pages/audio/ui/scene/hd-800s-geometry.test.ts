import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { expect, it } from "vitest";
import {
  earPadGeometry,
  headbandLabelGeometry,
  honeycombGrilleGeometry,
} from "./hd-800s-geometry";

it("leaves the honeycomb holes open while giving the metal webs real depth", () => {
  const geometry = honeycombGrilleGeometry();
  const material = new MeshBasicMaterial({ side: DoubleSide });
  const grille = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, 0, 10), new Vector3(0, 0, -1));
  expect(ray.intersectObject(grille)).toHaveLength(0);
  ray.set(new Vector3(0.52, 0.3, 10), new Vector3(0, 0, -1));
  expect(ray.intersectObject(grille).length).toBeGreaterThan(0);
  geometry.dispose();
  material.dispose();
});

it("exposes the rounded contact surface and keeps the ear-pad opening empty", () => {
  const geometry = earPadGeometry();
  const material = new MeshBasicMaterial();
  const pad = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(41, 0, -40), new Vector3(0, 0, 1));
  const contacts = ray.intersectObject(pad);
  expect(contacts.length).toBeGreaterThan(0);
  expect(contacts[0]?.face?.normal.z).toBeLessThan(0);
  ray.set(new Vector3(0, 0, -40), new Vector3(0, 0, 1));
  expect(ray.intersectObject(pad)).toHaveLength(0);
  geometry.dispose();
  material.dispose();
});

it("faces the headband lettering outward above the beveled outer surface", () => {
  const geometry = headbandLabelGeometry();
  const material = new MeshBasicMaterial();
  const label = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, 230, 0), new Vector3(0, -1, 0));
  const contacts = ray.intersectObject(label);
  expect(contacts.length).toBeGreaterThan(0);
  expect(contacts[0]?.point.y).toBeGreaterThan(225.5);
  geometry.dispose();
  material.dispose();
});
