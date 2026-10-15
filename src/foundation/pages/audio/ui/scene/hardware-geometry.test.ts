import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { expect, it } from "vitest";
import { screwHeadGeometry } from "./hardware-geometry";
import { bncBayonetGeometry } from "./bnc-geometry";

it("ねじの十字穴を貫通させ、外側の面取りを残す", () => {
  const geometry = screwHeadGeometry();
  const material = new MeshBasicMaterial();
  const screw = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(0, 0, 2), new Vector3(0, 0, -1));
  expect(ray.intersectObject(screw)).toHaveLength(0);
  ray.set(new Vector3(1.2, 0, 2), new Vector3(0, 0, -1));
  expect(ray.intersectObject(screw).length).toBeGreaterThan(0);
  geometry.dispose();
  material.dispose();
});

it.each([0, 64])("BNC の対向する L 字ロック溝を塞がない: %s", (side) => {
  const geometry = bncBayonetGeometry();
  const material = new MeshBasicMaterial();
  const collar = new Mesh(geometry, material);
  for (const [column, depth] of [
    [14, 2],
    [22, 4],
  ] as const) {
    const angle = ((column + side + 0.5) / 128) * Math.PI * 2;
    const direction = new Vector3(-Math.cos(angle), -Math.sin(angle), 0);
    const ray = new Raycaster(
      new Vector3(Math.cos(angle) * 9, Math.sin(angle) * 9, depth),
      direction,
      0,
      4
    );
    expect(ray.intersectObject(collar)).toHaveLength(0);
    ray.ray.origin.z = 6.5;
    expect(ray.intersectObject(collar).length).toBeGreaterThan(0);
  }
  geometry.dispose();
  material.dispose();
});
