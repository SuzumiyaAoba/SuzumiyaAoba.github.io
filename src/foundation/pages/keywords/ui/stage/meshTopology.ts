import { BufferAttribute, BufferGeometry } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** 位置だけを残して、同じ位置の頂点を 1 つにまとめた（添字付きの）形にする。 */
export function weld(source: BufferGeometry, tolerance = 1e-4) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", source.getAttribute("position").clone());
  if (source.index) {
    geometry.setIndex(source.index.clone());
  }
  const merged = mergeVertices(geometry, tolerance);
  geometry.dispose();
  return merged;
}

/** 各頂点に辺でつながった頂点の一覧。 */
export function vertexNeighbors(geometry: BufferGeometry) {
  const { count } = geometry.getAttribute("position");
  const sets = Array.from({ length: count }, () => new Set<number>());
  const { index } = geometry;
  if (!index) {
    return sets.map((set) => [...set]);
  }
  for (let n = 0; n < index.count; n += 3) {
    const a = index.getX(n);
    const b = index.getX(n + 1);
    const c = index.getX(n + 2);
    sets[a]?.add(b).add(c);
    sets[b]?.add(a).add(c);
    sets[c]?.add(a).add(b);
  }
  return sets.map((set) => [...set]);
}

/** 閉じた三角形メッシュの体積（各三角形と原点が作る四面体の符号付き体積の和）。 */
export function meshVolume(
  positions: ArrayLike<number>,
  index: ArrayLike<number>
) {
  let volume = 0;
  for (let n = 0; n < index.length; n += 3) {
    const a = (index[n] ?? 0) * 3;
    const b = (index[n + 1] ?? 0) * 3;
    const c = (index[n + 2] ?? 0) * 3;
    const ax = positions[a] ?? 0;
    const ay = positions[a + 1] ?? 0;
    const az = positions[a + 2] ?? 0;
    const bx = positions[b] ?? 0;
    const by = positions[b + 1] ?? 0;
    const bz = positions[b + 2] ?? 0;
    const cx = positions[c] ?? 0;
    const cy = positions[c + 1] ?? 0;
    const cz = positions[c + 2] ?? 0;
    volume +=
      (ax * (by * cz - bz * cy) -
        ay * (bx * cz - bz * cx) +
        az * (bx * cy - by * cx)) /
      6;
  }
  return Math.abs(volume);
}

/** 位置の配列を差し替えて、法線を計算し直す。 */
export function updatePositions(
  geometry: BufferGeometry,
  positions: Float32Array
) {
  const attribute = geometry.getAttribute("position");
  if (attribute instanceof BufferAttribute) {
    attribute.array.set(positions);
    attribute.needsUpdate = true;
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}
