import { Material, Mesh } from "three";
import type { BufferGeometry, Object3D } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

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
    part.material.onBeforeCompile === Material.prototype.onBeforeCompile &&
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

function createBatch(originals: StaticMesh[]): StaticMesh | undefined {
  const [first] = originals;
  if (!first || originals.length < 4) {
    return;
  }
  const geometries = originals.map((mesh) => {
    mesh.updateMatrix();
    return mesh.geometry.clone().applyMatrix4(mesh.matrix);
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

/** 同じ親を持つ静的な部品をまとめ、親の移動・表示切替と部品のローカル座標を保つ。 */
export function createViewerMeshBatches(root: Object3D) {
  const batches: MeshBatch[] = [];
  let disposed = false;

  return {
    refresh() {
      if (disposed) {
        return;
      }
      const parents: Object3D[] = [];
      root.traverse((part) => {
        if (part.children.length > 0) {
          parents.push(part);
        }
      });
      for (const parent of parents) {
        const candidates = new Map<string, StaticMesh[]>();
        for (const child of parent.children) {
          if (!isStaticMesh(child)) {
            continue;
          }
          const key = batchKey(child);
          const meshes = candidates.get(key);
          if (meshes) {
            meshes.push(child);
          } else {
            candidates.set(key, [child]);
          }
        }
        for (const originals of candidates.values()) {
          const mesh = createBatch(originals);
          if (mesh) {
            parent.add(mesh);
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
