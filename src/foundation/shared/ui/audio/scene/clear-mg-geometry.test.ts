import {
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Vector3,
  SRGBColorSpace,
  NoColorSpace,
} from "three";
import { expect, it } from "vitest";
import {
  clearMgGrilleGeometry,
  clearMgDriverHeight,
} from "./clear-mg-geometry";
import { createClearMgFabricTextures } from "./clear-mg-fabric";
import { clearMgShellGeometry } from "./clear-mg-shell";

it("グリルの広い曲面を三角形ごとの法線で分断せず、内側にはM字の谷を作る", () => {
  const geometry = clearMgGrilleGeometry({
    radiusX: 44,
    radiusY: 54,
    cellRadius: 3.05,
    opening: 16.8,
    depth: 0.6,
    dome: 2.7,
    z: 8.2,
    graded: true,
  });
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  let checked = 0;
  const faceCount = geometry.groups[0]?.count ?? 0;
  for (let index = 0; index < faceCount; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const height = 8.255 + 2.7 * Math.max(0, 1 - (x / 44) ** 2 - (y / 54) ** 2);
    if (
      Math.abs(positions.getZ(index) - height) > 0.00001 ||
      (x / 44) ** 2 + (y / 54) ** 2 > 0.95
    ) {
      continue;
    }
    const expected = new Vector3(
      (5.4 * x) / 44 ** 2,
      (5.4 * y) / 54 ** 2,
      1
    ).normalize();
    expect(
      expected.dot(new Vector3().fromBufferAttribute(normals, index))
    ).toBeGreaterThan(0.9999);
    checked += 1;
  }
  expect(checked).toBeGreaterThan(100);
  expect(clearMgDriverHeight(11)).toBeGreaterThan(clearMgDriverHeight(0));
  expect(clearMgDriverHeight(11)).toBeGreaterThan(clearMgDriverHeight(17.4));
  expect(clearMgDriverHeight(21)).toBeGreaterThan(clearMgDriverHeight(17.4));
  geometry.dispose();
});

it("楕円の外壁と内壁の両方に底面ジャックを貫通させる", () => {
  const geometry = clearMgShellGeometry();
  const material = new MeshBasicMaterial();
  const shell = new Mesh(geometry, material);
  const ray = new Raycaster(
    new Vector3(0, -70, -0.5),
    new Vector3(0, 1, 0),
    0,
    25
  );
  expect(ray.intersectObject(shell)).toHaveLength(0);
  ray.ray.origin.x = 5;
  expect(ray.intersectObject(shell).length).toBeGreaterThan(0);
  geometry.dispose();
  material.dispose();
});

it("ハニカムの穴を貫通させ、外周とメダリオン周囲の金属をつなぐ", () => {
  const geometry = clearMgGrilleGeometry({
    radiusX: 44,
    radiusY: 54,
    cellRadius: 3.05,
    opening: 16.8,
    depth: 0.6,
    dome: 2.7,
    z: 8.2,
  });
  const material = new MeshBasicMaterial();
  const grille = new Mesh(geometry, material);
  const ray = new Raycaster(new Vector3(), new Vector3(0, 0, -1));
  for (const x of [0, 36.6]) {
    ray.ray.origin.set(x, 0, 20);
    expect(ray.intersectObject(grille)).toHaveLength(0);
  }
  for (const x of [17, 43.7]) {
    ray.ray.origin.set(x, 0, 20);
    expect(ray.intersectObject(grille).length).toBeGreaterThan(0);
  }
  // 個々の六角形を重ねず、一枚のグリルとして扱える頂点数を保つ。
  expect(geometry.getAttribute("position").count).toBeLessThan(180_000);
  geometry.dispose();
  material.dispose();
});

it("布の色だけを sRGB にし、高さと粗さは線形値として描画する", () => {
  const fabric = createClearMgFabricTextures();
  expect(fabric.color.colorSpace).toBe(SRGBColorSpace);
  expect(fabric.height.colorSpace).toBe(NoColorSpace);
  expect(fabric.roughness.colorSpace).toBe(NoColorSpace);
  expect(fabric.height.image.data).not.toStrictEqual(fabric.color.image.data);
  for (const texture of Object.values(fabric)) {
    expect(texture.generateMipmaps).toBe(true);
    texture.dispose();
  }
});
