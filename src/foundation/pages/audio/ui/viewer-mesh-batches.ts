import { Material, Matrix4, Mesh } from "three";
import type { BufferGeometry, Object3D } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { hasSurfaceFinish } from "./scene/surface-finish";

type StaticMesh = Mesh<BufferGeometry, Material>;
type MeshBatch = { mesh: StaticMesh; originals: StaticMesh[] };

function isMesh(part: Object3D): part is Mesh {
  return part instanceof Mesh;
}

function isStaticMesh(part: Object3D): part is StaticMesh {
  if (!isMesh(part) || Array.isArray(part.material)) {
    return false;
  }
  return (
    part.constructor === Mesh &&
    (part.material.onBeforeCompile === Material.prototype.onBeforeCompile ||
      hasSurfaceFinish(part.material)) &&
    !part.material.transparent &&
    part.visible &&
    part.children.length === 0 &&
    Object.keys(part.geometry.morphAttributes).length === 0 &&
    part.geometry.drawRange.start === 0 &&
    part.geometry.drawRange.count === Infinity &&
    part.scale.x > 0 &&
    part.scale.y > 0 &&
    part.scale.z > 0
  );
}

function batchKey(mesh: StaticMesh) {
  const attributes = Object.entries(mesh.geometry.attributes)
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(
      ([name, attribute]) =>
        `${name}:${attribute.itemSize}:${attribute.normalized}:${attribute.array.constructor.name}`
    );
  return [
    mesh.material.uuid,
    mesh.geometry.index !== null,
    mesh.castShadow,
    mesh.receiveShadow,
    mesh.renderOrder,
    mesh.layers.mask,
    mesh.frustumCulled,
    ...attributes,
  ].join("/");
}

function collectParts(parent: Object3D, mergedMeshes: WeakSet<Object3D>) {
  const meshes: StaticMesh[] = [];
  const recursive = parent.userData["audioStaticRoot"] === true;
  const inverse = parent.matrixWorld.clone().invert();
  const transform = new Matrix4();
  const visit = (part: Object3D) => {
    for (const child of part.children) {
      if (
        !child.visible ||
        mergedMeshes.has(child) ||
        child.userData["audioStaticRoot"] === true
      ) {
        continue;
      }
      if (isStaticMesh(child)) {
        transform.multiplyMatrices(inverse, child.matrixWorld);
        // 鏡像の部品は元の親の下で結合し、表裏の判定を保つ。
        if (transform.determinant() > 0) {
          meshes.push(child);
        }
      }
      if (recursive && child.children.length > 0) {
        visit(child);
      }
    }
  };
  visit(parent);
  return meshes;
}

function createBatch(
  originals: StaticMesh[],
  parent: Object3D
): StaticMesh | undefined {
  const [first] = originals;
  if (!first || originals.length < 4) {
    return;
  }
  const inverse = parent.matrixWorld.clone().invert();
  const transform = new Matrix4();
  const geometries = originals.map((mesh) => {
    const geometry = mesh.geometry.clone();
    transform.multiplyMatrices(inverse, mesh.matrixWorld);
    return geometry.applyMatrix4(transform);
  });
  try {
    const geometry = mergeGeometries(geometries);
    if (geometry === null) {
      return;
    }
    const batch = new Mesh(geometry, first.material);
    batch.name = "Batched static audio parts";
    batch.castShadow = first.castShadow;
    batch.receiveShadow = first.receiveShadow;
    batch.renderOrder = first.renderOrder;
    batch.layers.mask = first.layers.mask;
    batch.frustumCulled = first.frustumCulled;
    batch.userData["castShadow"] = first.castShadow;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return batch;
  } finally {
    for (const geometry of geometries) {
      geometry.dispose();
    }
  }
}

/** 静的な部品をまとめ、機器の移動・表示切替と質感に使うローカル座標を保つ。 */
export function createViewerMeshBatches(root: Object3D) {
  const batches: MeshBatch[] = [];
  const mergedMeshes = new WeakSet<Object3D>();
  let disposed = false;

  return {
    refresh() {
      if (disposed) {
        return;
      }
      root.updateWorldMatrix(true, true);
      const parents: Object3D[] = [];
      root.traverse((part) => {
        if (
          isMesh(part) &&
          !Array.isArray(part.material) &&
          hasSurfaceFinish(part.material) &&
          !part.geometry.hasAttribute("audioOriginalPosition")
        ) {
          // 元の部品は位置バッファを共有し、結合した形状では変換前の座標を残す。
          part.geometry.setAttribute(
            "audioOriginalPosition",
            part.geometry.getAttribute("position")
          );
        }
        if (part.children.length > 0) {
          parents.push(part);
        }
      });
      for (const parent of parents) {
        const candidates = new Map<string, StaticMesh[]>();
        for (const child of collectParts(parent, mergedMeshes)) {
          const key = batchKey(child);
          const meshes = candidates.get(key);
          if (meshes) {
            meshes.push(child);
          } else {
            candidates.set(key, [child]);
          }
        }
        for (const originals of candidates.values()) {
          const mesh = createBatch(originals, parent);
          if (mesh) {
            parent.add(mesh);
            mergedMeshes.add(mesh);
            batches.push({ mesh, originals });
            for (const original of originals) {
              original.visible = false;
            }
          }
        }
      }
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      for (const { mesh, originals } of batches) {
        mesh.removeFromParent();
        mesh.geometry.dispose();
        for (const original of originals) {
          original.visible = true;
        }
      }
      batches.length = 0;
    },
  };
}
