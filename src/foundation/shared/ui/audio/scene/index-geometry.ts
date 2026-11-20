import {
  BufferAttribute,
  InstancedBufferAttribute,
  StaticDrawUsage,
} from "three";
import type { BufferGeometry, InterleavedBufferAttribute } from "three";

type FloatAttribute = BufferAttribute & { array: Float32Array };

function isStaticFloat(
  attribute: BufferAttribute | InterleavedBufferAttribute
): attribute is FloatAttribute {
  return (
    attribute instanceof BufferAttribute &&
    !(attribute instanceof InstancedBufferAttribute) &&
    attribute.array instanceof Float32Array &&
    attribute.usage === StaticDrawUsage
  );
}

function sameVertex(attributes: FloatAttribute[], left: number, right: number) {
  for (const { array, itemSize } of attributes) {
    for (let component = 0; component < itemSize; component += 1) {
      if (
        !Object.is(
          array[left * itemSize + component],
          array[right * itemSize + component]
        )
      ) {
        return false;
      }
    }
  }
  return true;
}

// 位置のビット列は候補の検索にだけ使う。共有の可否は全属性の値で決める。
function positionHash(bits: Uint32Array, vertex: number) {
  let hash = 2_166_136_261;
  for (let axis = 0; axis < 3; axis += 1) {
    // oxlint-disable-next-line no-bitwise -- 浮動小数点数のビット列を FNV-1a で混合する。
    hash = Math.imul(hash ^ (bits[vertex * 3 + axis] ?? 0), 16_777_619);
  }
  // oxlint-disable-next-line no-bitwise -- 整数座標でも上位ビットを表の位置に反映する。
  return hash ^ (hash >>> 16);
}

function vertexRemap(positions: FloatAttribute, attributes: FloatAttribute[]) {
  const { count, array } = positions;
  const bits = new Uint32Array(array.buffer, array.byteOffset, array.length);
  const slots = new Uint32Array(2 ** Math.ceil(Math.log2(count * 2)));
  const mask = slots.length - 1;
  const sources = new Uint32Array(count);
  const indices = new Uint32Array(count);
  let unique = 0;
  for (let vertex = 0; vertex < count; vertex += 1) {
    // oxlint-disable-next-line no-bitwise -- 2 のべき乗の表内に収める。
    let slot = positionHash(bits, vertex) & mask;
    let entry = slots[slot] ?? 0;
    while (entry && !sameVertex(attributes, sources[entry - 1] ?? 0, vertex)) {
      slot = (slot + 1) % slots.length;
      entry = slots[slot] ?? 0;
    }
    if (!entry) {
      sources[unique] = vertex;
      unique += 1;
      entry = unique;
      slots[slot] = entry;
    }
    indices[vertex] = entry - 1;
  }
  return { indices, sources: sources.subarray(0, unique) };
}

function compactAttribute(attribute: FloatAttribute, sources: Uint32Array) {
  const { array, itemSize, normalized } = attribute;
  const compact = new Float32Array(sources.length * itemSize);
  for (const [target, source] of sources.entries()) {
    for (let component = 0; component < itemSize; component += 1) {
      compact[target * itemSize + component] =
        array[source * itemSize + component] ?? 0;
    }
  }
  const result = new BufferAttribute(compact, itemSize, normalized);
  result.name = attribute.name;
  result.gpuType = attribute.gpuType;
  return result;
}

/** 押し出し・面取りの三角形を、法線や UV の継ぎ目も含めて同じ順序で描く。 */
export function indexAudioGeometry(geometry: BufferGeometry) {
  const positions = geometry.getAttribute("position");
  if (
    geometry.index ||
    !isStaticFloat(positions) ||
    positions.itemSize !== 3 ||
    !positions.count ||
    Object.keys(geometry.morphAttributes).length > 0
  ) {
    return;
  }
  const attributes = Object.values(geometry.attributes);
  if (
    !attributes.every(isStaticFloat) ||
    attributes.some((attribute) => attribute.count !== positions.count)
  ) {
    return;
  }
  const { indices, sources } = vertexRemap(positions, attributes);
  // WebGL の固定プリミティブリスタート値 0xffff は頂点番号に使わない。
  const shortIndices = sources.length <= 65_535;
  const indexBytes = indices.length * (shortIndices ? 2 : 4);
  const stride = attributes.reduce(
    (sum, attribute) => sum + attribute.itemSize * 4,
    0
  );
  if ((positions.count - sources.length) * stride <= indexBytes) {
    return;
  }
  const names = Object.keys(geometry.attributes);
  for (const [index, attribute] of attributes.entries()) {
    const name = names[index];
    if (name !== undefined) {
      geometry.setAttribute(name, compactAttribute(attribute, sources));
    }
  }
  geometry.setIndex(
    new BufferAttribute(shortIndices ? new Uint16Array(indices) : indices, 1)
  );
}
