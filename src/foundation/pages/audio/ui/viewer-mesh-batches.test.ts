import {
  Box3,
  BoxGeometry,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from "three";
import type { Object3D } from "three";
import { afterEach, expect, it, vi } from "vite-plus/test";
import { createViewerMeshBatches } from "./viewer-mesh-batches";

const disposals: (() => void)[] = [];

afterEach(() => {
  for (const dispose of disposals) {
    dispose();
  }
  disposals.length = 0;
});

function parts(parent = new Group(), material = new MeshStandardMaterial()) {
  const geometry = new BoxGeometry(2, 4, 6);
  const meshes = Array.from({ length: 4 }, (_, index) => {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(index * 10, index, 0);
    mesh.rotation.y = index * 0.2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  });
  disposals.push(() => {
    geometry.dispose();
    material.dispose();
  });
  return { parent, meshes, geometry, material };
}

function visibleMeshes(root: Object3D) {
  const meshes: Mesh[] = [];
  root.traverseVisible((part) => {
    if (isMesh(part)) {
      meshes.push(part);
    }
  });
  return meshes;
}

function isMesh(part: Object3D): part is Mesh {
  return part instanceof Mesh;
}

function optimize(root: Object3D) {
  const batches = createViewerMeshBatches(root);
  disposals.unshift(() => batches.dispose());
  batches.refresh();
  return batches;
}

it("材質を共有する部品の描画をまとめ、位置・回転・親の拡大と影を保つ", () => {
  const { parent, material, meshes, geometry } = parts();
  parent.position.set(20, 10, -30);
  parent.rotation.x = 0.4;
  parent.scale.set(2, 1, 3);
  const bounds = new Box3().setFromObject(parent, true);
  const positions = geometry.getAttribute("position").clone();
  optimize(parent);
  const rendered = visibleMeshes(parent);
  expect(rendered).toHaveLength(1);
  const [batch] = rendered;
  if (!batch) {
    throw new Error("The merged model is missing");
  }
  const mergedBounds = new Box3().setFromObject(batch, true);
  expect(mergedBounds.min.distanceTo(bounds.min)).toBeLessThan(0.0001);
  expect(mergedBounds.max.distanceTo(bounds.max)).toBeLessThan(0.0001);
  expect(batch.geometry.index?.count).toBe((geometry.index?.count ?? 0) * 4);
  expect(batch.material).toBe(material);
  expect(batch.castShadow).toBe(true);
  expect(batch.receiveShadow).toBe(true);
  expect(geometry.getAttribute("position").array).toStrictEqual(
    positions.array
  );
  expect(meshes.every((mesh) => mesh.parent === parent)).toBe(true);
  const normal = new Vector3().fromBufferAttribute(
    batch.geometry.getAttribute("normal"),
    geometry.getAttribute("normal").count
  );
  expect(normal.x).toBeCloseTo(Math.cos(0.2));
  expect(normal.z).toBeCloseTo(-Math.sin(0.2));
});

it("透過・独自シェーダー・インスタンス描画と少数の部品には手を加えない", () => {
  const root = new Group();
  const transparent = new MeshStandardMaterial({ transparent: true });
  const custom = new MeshStandardMaterial();
  custom.onBeforeCompile = () => {};
  const transparentParts = parts(new Group(), transparent);
  const customParts = parts(new Group(), custom);
  const small = parts();
  const [removed] = small.meshes;
  if (removed) {
    small.parent.remove(removed);
  }
  const instanced = new InstancedMesh(small.geometry, small.material, 4);
  root.add(
    transparentParts.parent,
    customParts.parent,
    small.parent,
    instanced
  );
  disposals.push(() => instanced.dispose());
  optimize(root);
  expect(visibleMeshes(root)).toHaveLength(12);
  expect(transparentParts.meshes.every((mesh) => mesh.visible)).toBe(true);
  expect(customParts.meshes.every((mesh) => mesh.visible)).toBe(true);
});

it("ヘッドホンを切り替えても親グループの表示状態を保ち、追加モデルだけを結合する", () => {
  const root = new Group();
  const first = parts();
  root.add(first.parent);
  const batches = optimize(root);
  const [initial] = visibleMeshes(root);
  const next = parts();
  root.add(next.parent);
  first.parent.visible = false;
  batches.refresh();
  expect(visibleMeshes(root)).toHaveLength(1);
  expect(visibleMeshes(root)[0]).not.toBe(initial);
  next.parent.visible = false;
  first.parent.visible = true;
  batches.refresh();
  expect(visibleMeshes(root)).toStrictEqual([initial]);
});

it("影・描画順・頂点属性の異なる部品を混ぜない", () => {
  const { parent, geometry, material } = parts();
  const noShadow = parts(parent, material);
  for (const mesh of noShadow.meshes) {
    mesh.castShadow = false;
    mesh.renderOrder = 2;
  }
  const nonIndexed = geometry.toNonIndexed();
  disposals.push(() => nonIndexed.dispose());
  for (let index = 0; index < 4; index += 1) {
    parent.add(new Mesh(nonIndexed, material));
  }
  optimize(parent);
  const rendered = visibleMeshes(parent);
  expect(rendered).toHaveLength(3);
  expect(rendered.some((mesh) => mesh.geometry.index === null)).toBe(true);
  expect(
    rendered.some((mesh) => !mesh.castShadow && mesh.renderOrder === 2)
  ).toBe(true);
});

it("結合したGPU資源だけを一度解放し、元のモデルや共有材質を破棄しない", () => {
  const { parent, geometry, material } = parts();
  const batches = optimize(parent);
  const [batch] = visibleMeshes(parent);
  const mergedDisposed = vi.fn<() => void>();
  const originalDisposed = vi.fn<() => void>();
  const materialDisposed = vi.fn<() => void>();
  batch?.geometry.addEventListener("dispose", mergedDisposed);
  geometry.addEventListener("dispose", originalDisposed);
  material.addEventListener("dispose", materialDisposed);
  batches.dispose();
  batches.dispose();
  batches.refresh();
  expect(mergedDisposed).toHaveBeenCalledTimes(1);
  expect(originalDisposed).not.toHaveBeenCalled();
  expect(materialDisposed).not.toHaveBeenCalled();
  expect(visibleMeshes(parent)).toHaveLength(4);
});
