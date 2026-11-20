import { BufferGeometry, Float32BufferAttribute, Vector2 } from "three";

type ProfilePoint = readonly [radius: number, height: number];
const creaseCosine = Math.cos(Math.PI / 3);
const maxChordError = 0.006; // mm

function joinNormal(before: Vector2, after: Vector2) {
  if (before.dot(after) < creaseCosine) {
    return;
  }
  // 平らな端面と円筒の法線を面取りの端まで保つ。
  if (before.x === 0 || before.y === 0) {
    return before;
  }
  if (after.x === 0 || after.y === 0) {
    return after;
  }
  return before.clone().add(after).normalize();
}

/** 旋削断面を回転する。段差で法線を分け、丸みと UV の継ぎ目を滑らかにつなぐ。 */
export function turnedProfileGeometry(profile: readonly ProfilePoint[]) {
  const radius = Math.max(...profile.map(([r]) => r), maxChordError);
  const halfAngle = Math.acos(1 - maxChordError / radius);
  const segments = Math.max(32, 4 * Math.ceil(Math.PI / (4 * halfAngle)));
  const circle = Array.from({ length: segments + 1 }, (_, i) => {
    const angle = ((i % segments) / segments) * Math.PI * 2;
    return [Math.sin(angle), Math.cos(angle)] as const;
  });
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const ring = ([r, y]: ProfilePoint, normal: Vector2, row: number) => {
    const start = positions.length / 3;
    for (const [column, [sin, cos]] of circle.entries()) {
      positions.push(r * sin, y, r * cos);
      normals.push(normal.x * sin, normal.y, normal.x * cos);
      uvs.push(column / segments, row / (profile.length - 1));
    }
    return start;
  };
  const edges = profile.slice(1).map(([r, y], i) => {
    const previous = profile[i];
    return previous
      ? new Vector2(y - previous[1], previous[0] - r).normalize()
      : new Vector2();
  });
  const [first] = profile;
  const last = profile.at(-1);
  const closed = first && last && first[0] === last[0] && first[1] === last[1];
  const joins = profile.map((_, i) => {
    const before = edges[i - 1] ?? (closed ? edges.at(-1) : undefined);
    const after = edges[i] ?? (closed ? edges[0] : undefined);
    return before && after ? joinNormal(before, after) : undefined;
  });
  let previousRing = 0;
  for (const [i, edge] of edges.entries()) {
    const from = profile[i];
    const to = profile[i + 1];
    if (!from || !to) {
      continue;
    }
    const start =
      i > 0 && joins[i] ? previousRing : ring(from, joins[i] ?? edge, i);
    const end = ring(to, joins[i + 1] ?? edge, i + 1);
    for (let column = 0; column < segments; column += 1) {
      const a = start + column;
      const b = end + column;
      if (from[0] > 0) {
        indices.push(a, a + 1, b);
      }
      if (to[0] > 0) {
        indices.push(b + 1, b, a + 1);
      }
    }
    previousRing = end;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  return geometry;
}
