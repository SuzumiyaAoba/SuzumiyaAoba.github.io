import { DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { expect, it } from "vitest";
import {
  earPadGeometry,
  acousticBaffleGeometry,
  baffleBraceGeometry,
  cupContour,
  headbandCushionGeometry,
  headbandLabelGeometry,
  honeycombGrilleGeometry,
} from "./hd-800s-geometry";

it("バッフルの中央を開け、外周からドライバーへ立体的につなぐ", () => {
  const geometry = acousticBaffleGeometry();
  const material = new MeshBasicMaterial();
  const baffle = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(2, -7, 40), new Vector3(0, 0, -1));
  expect(ray.intersectObject(baffle)).toHaveLength(0);
  ray.set(new Vector3(2, 45, 40), new Vector3(0, 0, -1));
  const [outer] = ray.intersectObject(baffle);
  ray.set(new Vector3(2, 32, 40), new Vector3(0, 0, -1));
  const [inner] = ray.intersectObject(baffle);
  expect(outer?.face?.normal.z).toBeGreaterThan(0);
  expect(inner?.point.z).toBeGreaterThan((outer?.point.z ?? 0) + 4);
  geometry.dispose();
  material.dispose();
});

it("補強部の表面を外側に向け、傾斜したバッフルより手前に保つ", () => {
  const baffleGeometry = acousticBaffleGeometry();
  const braceGeometry = baffleBraceGeometry(Math.PI / 2);
  const material = new MeshBasicMaterial();
  const baffle = new Mesh(baffleGeometry, material);
  const brace = new Mesh(braceGeometry, material);
  const ray = new Raycaster(new Vector3(3, 39, 40), new Vector3(0, 0, -1));
  const [baffleContact] = ray.intersectObject(baffle);
  const [braceContact] = ray.intersectObject(brace);
  expect(braceContact?.face?.normal.z).toBeGreaterThan(0);
  expect(braceContact?.point.z).toBeGreaterThan(
    (baffleContact?.point.z ?? 0) + 1.5
  );
  baffleGeometry.dispose();
  braceGeometry.dispose();
  material.dispose();
});

it("筐体を上下で幅の異なる輪郭にし、パッドの継ぎ目にも同じ輪郭を使う", () => {
  const upperRight = cupContour(Math.PI / 4);
  const upperLeft = cupContour(Math.PI * 0.75);
  const lowerRight = cupContour(-Math.PI / 4);
  const lowerLeft = cupContour(Math.PI * 1.25);
  expect(lowerRight.x - lowerLeft.x).toBeGreaterThan(
    upperRight.x - upperLeft.x
  );
  expect(upperRight.x + upperLeft.x).toBeGreaterThan(0);
  expect(lowerRight.x + lowerLeft.x).toBeLessThan(0);
});

it("ヘッドバンドの接触面を丸め、頭部側から見える向きにする", () => {
  const geometry = headbandCushionGeometry();
  const material = new MeshBasicMaterial();
  const cushion = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, 200, 0), new Vector3(0, 1, 0));
  const [contact] = ray.intersectObject(cushion);
  expect(contact?.point.y).toBeGreaterThan(211);
  expect(contact?.point.y).toBeLessThan(214);
  expect(contact?.face?.normal.y).toBeLessThan(0);
  geometry.dispose();
  material.dispose();
});

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
