import {
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  Shape,
  Vector2,
  Vector3,
} from "three";

export const ie600Vent = { x: -4.4, y: -5.9, floor: 1.2 } as const;

export function ie600VentOutline() {
  const shape = new Shape();
  shape.absarc(ie600Vent.x + 0.7, ie600Vent.y, 0.42, -Math.PI / 2, Math.PI / 2);
  shape.absarc(
    ie600Vent.x - 0.7,
    ie600Vent.y,
    0.42,
    Math.PI / 2,
    Math.PI * 1.5
  );
  shape.closePath();
  return shape;
}

type Vertex = { position: Vector3; normal: Vector3; uv: Vector2 };

function dividePolygon(polygon: Vertex[], start: Vector2, end: Vector2) {
  const inside: Vertex[] = [];
  const outside: Vertex[] = [];
  const distance = (point: Vector3) =>
    (end.x - start.x) * (point.y - start.y) -
    (end.y - start.y) * (point.x - start.x);
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    if (!current || !next) {
      continue;
    }
    const a = distance(current.position);
    const b = distance(next.position);
    (a >= 0 ? inside : outside).push(current);
    if (a >= 0 !== b >= 0) {
      const ratio = a / (a - b);
      const intersection = {
        position: current.position.clone().lerp(next.position, ratio),
        normal: current.normal.clone().lerp(next.normal, ratio).normalize(),
        uv: current.uv.clone().lerp(next.uv, ratio),
      };
      inside.push(intersection);
      outside.push(intersection);
    }
  }
  return { inside, outside };
}

/** 曲面の三角形を開口の輪郭で切り、元の補間法線を保持する。 */
export function openIe600Vent(source: BufferGeometry) {
  const position = source.getAttribute("position");
  const normal = source.getAttribute("normal");
  const uv = source.getAttribute("uv");
  const sourceIndices = source.getIndex();
  if (!sourceIndices) {
    throw new Error("The IE 600 shell must have indexed geometry.");
  }
  const positions = [...position.array];
  const normals = [...normal.array];
  const uvs = [...uv.array];
  const indices: number[] = [];
  const outline = ie600VentOutline().getPoints(12).slice(0, -1);
  const append = (polygon: Vertex[]) => {
    const first = positions.length / 3;
    for (const vertex of polygon) {
      positions.push(...vertex.position.toArray());
      normals.push(...vertex.normal.toArray());
      uvs.push(...vertex.uv.toArray());
    }
    for (let index = 1; index + 1 < polygon.length; index += 1) {
      indices.push(first, first + index, first + index + 1);
    }
  };
  for (let index = 0; index < sourceIndices.count; index += 3) {
    const triangle = [0, 1, 2].map((offset) =>
      sourceIndices.getX(index + offset)
    );
    if (
      triangle.every((vertex) => position.getZ(vertex) <= 0) ||
      triangle.every((vertex) => position.getX(vertex) < ie600Vent.x - 1.2) ||
      triangle.every((vertex) => position.getX(vertex) > ie600Vent.x + 1.2) ||
      triangle.every((vertex) => position.getY(vertex) < ie600Vent.y - 0.5) ||
      triangle.every((vertex) => position.getY(vertex) > ie600Vent.y + 0.5)
    ) {
      indices.push(...triangle);
      continue;
    }
    let remainder = triangle.map((vertex) => ({
      position: new Vector3().fromBufferAttribute(position, vertex),
      normal: new Vector3().fromBufferAttribute(normal, vertex),
      uv: new Vector2(uv.getX(vertex), uv.getY(vertex)),
    }));
    for (let edge = 0; edge < outline.length; edge += 1) {
      const start = outline[edge];
      const end = outline[(edge + 1) % outline.length];
      if (!start || !end || remainder.length < 3) {
        break;
      }
      const split = dividePolygon(remainder, start, end);
      append(split.outside);
      remainder = split.inside;
    }
  }
  const material = new MeshBasicMaterial();
  const shell = new Mesh(source, material);
  const ray = new Raycaster(new Vector3(), new Vector3(0, 0, -1));
  const wall = outline.map((point) => {
    ray.ray.origin.set(point.x, point.y, 8);
    return new Vector3(
      point.x,
      point.y,
      ray.intersectObject(shell)[0]?.point.z ?? 3
    );
  });
  for (let index = 0; index < wall.length; index += 1) {
    const start = wall[index];
    const end = wall[(index + 1) % wall.length];
    if (!start || !end) {
      continue;
    }
    const inward = new Vector3(start.y - end.y, end.x - start.x, 0).normalize();
    append(
      [
        start.clone().setZ(ie600Vent.floor),
        start,
        end,
        end.clone().setZ(ie600Vent.floor),
      ].map((point) => ({
        position: point,
        normal: inward,
        uv: new Vector2((point.x + 14) / 28, (point.y + 12) / 28),
      }))
    );
  }
  material.dispose();
  source.dispose();
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}
