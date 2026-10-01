import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from "three";
import type { ColorRepresentation } from "three";
import { delaunaySteps } from "./delaunay";
import type { Point2, Triangle } from "./delaunay";
import { segments, standard } from "./kit";
import { MinHeap } from "./navgrid";

/** 軸に平行な長方形（x, y は xz 平面の x, z）。 */
export type Rect = { x0: number; y0: number; x1: number; y1: number };

export type NavMesh = {
  vertices: Point2[];
  triangles: Triangle[];
  /** 三角形ごとの隣：[隣の三角形, 共有する辺の頂点 a, b]。 */
  links: [number, number, number][][];
  centroids: Point2[];
  bounds: Rect;
  obstacles: Rect[];
};

const inside = (rect: Rect, x: number, y: number) =>
  x > rect.x0 && x < rect.x1 && y > rect.y0 && y < rect.y1;

/**
 * 歩ける領域（bounds から obstacles を除いた所）を三角形に分ける。
 * 障害物は radius だけ広げる（キャラクターの太さの分だけ歩ける面を縮める）。
 * 辺に沿って点を足してからドロネー分割し、障害物の中の三角形を捨てる。
 */
export function buildNavMesh(
  bounds: Rect,
  obstacles: readonly Rect[],
  radius: number,
  spacing = 0.8
): NavMesh {
  const inner: Rect = {
    x0: bounds.x0 + radius,
    y0: bounds.y0 + radius,
    x1: bounds.x1 - radius,
    y1: bounds.y1 - radius,
  };
  const grown = obstacles.map((rect) => ({
    x0: Math.max(inner.x0, rect.x0 - radius),
    y0: Math.max(inner.y0, rect.y0 - radius),
    x1: Math.min(inner.x1, rect.x1 + radius),
    y1: Math.min(inner.y1, rect.y1 + radius),
  }));
  const points: Point2[] = [];
  const seen = new Set<string>();
  const add = (x: number, y: number) => {
    const key = `${x.toFixed(3)},${y.toFixed(3)}`;
    if (seen.has(key)) {
      return;
    }
    // 障害物の内側の点は使わない（重なった障害物の角など）
    if (grown.some((rect) => inside(rect, x, y))) {
      return;
    }
    seen.add(key);
    points.push({ x, y });
  };
  const outline = (rect: Rect) => {
    const edges: [number, number, number, number][] = [
      [rect.x0, rect.y0, rect.x1, rect.y0],
      [rect.x1, rect.y0, rect.x1, rect.y1],
      [rect.x1, rect.y1, rect.x0, rect.y1],
      [rect.x0, rect.y1, rect.x0, rect.y0],
    ];
    for (const [ax, ay, bx, by] of edges) {
      const count = Math.max(
        1,
        Math.round(Math.hypot(bx - ax, by - ay) / spacing)
      );
      for (let k = 0; k < count; k++) {
        const t = k / count;
        add(ax + (bx - ax) * t, ay + (by - ay) * t);
      }
    }
  };
  outline(inner);
  for (const rect of grown) {
    outline(rect);
  }
  // 点がきれいな格子に並ぶと外接円の判定が不安定になるので、ほんの少しずらす
  let seed = 7;
  const jitter = () => {
    seed = (seed * 16_807) % 2_147_483_647;
    return (seed / 2_147_483_647 - 0.5) * 1e-4;
  };
  const vertices = points.map((p) => ({
    x: p.x + jitter(),
    y: p.y + jitter(),
  }));
  const { triangles: all } = delaunaySteps(vertices);
  const at = (i: number) => vertices[i] ?? { x: 0, y: 0 };
  const triangles = all.filter(([a, b, c]) => {
    const pa = at(a);
    const pb = at(b);
    const pc = at(c);
    const cx = (pa.x + pb.x + pc.x) / 3;
    const cy = (pa.y + pb.y + pc.y) / 3;
    const area = Math.abs(
      (pb.x - pa.x) * (pc.y - pa.y) - (pb.y - pa.y) * (pc.x - pa.x)
    );
    return area > 1e-6 && !grown.some((rect) => inside(rect, cx, cy));
  });
  const edgeOwner = new Map<string, number>();
  const links: [number, number, number][][] = triangles.map(() => []);
  for (const [index, triangle] of triangles.entries()) {
    for (let k = 0; k < 3; k++) {
      const a = triangle[k] ?? 0;
      const b = triangle[(k + 1) % 3] ?? 0;
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      const other = edgeOwner.get(key);
      if (other === undefined) {
        edgeOwner.set(key, index);
      } else {
        links[index]?.push([other, a, b]);
        links[other]?.push([index, a, b]);
      }
    }
  }
  const centroids = triangles.map(([a, b, c]) => ({
    x: (at(a).x + at(b).x + at(c).x) / 3,
    y: (at(a).y + at(b).y + at(c).y) / 3,
  }));
  return {
    vertices,
    triangles,
    links,
    centroids,
    bounds: inner,
    obstacles: grown,
  };
}

const cross = (o: Point2, a: Point2, b: Point2) =>
  (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

/** 点を含む三角形（なければ -1）。 */
export function locate(mesh: NavMesh, p: Point2) {
  for (const [index, [a, b, c]] of mesh.triangles.entries()) {
    const pa = mesh.vertices[a];
    const pb = mesh.vertices[b];
    const pc = mesh.vertices[c];
    if (!pa || !pb || !pc) {
      continue;
    }
    const d1 = cross(pa, pb, p);
    const d2 = cross(pb, pc, p);
    const d3 = cross(pc, pa, p);
    const negative = d1 < -1e-9 || d2 < -1e-9 || d3 < -1e-9;
    const positive = d1 > 1e-9 || d2 > 1e-9 || d3 > 1e-9;
    if (!(negative && positive)) {
      return index;
    }
  }
  return -1;
}

/** 三角形をノードとする A*（重心どうしの距離をコストにする）。通る三角形の列を返す。 */
export function findCorridor(mesh: NavMesh, from: number, to: number) {
  const n = mesh.triangles.length;
  const g = new Float64Array(n).fill(Number.POSITIVE_INFINITY);
  const parent = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const heap = new MinHeap();
  const distance = (a: number, b: number) => {
    const pa = mesh.centroids[a] ?? { x: 0, y: 0 };
    const pb = mesh.centroids[b] ?? { x: 0, y: 0 };
    return Math.hypot(pa.x - pb.x, pa.y - pb.y);
  };
  g[from] = 0;
  heap.push(from, distance(from, to));
  let expanded = 0;
  while (heap.size > 0) {
    const current = heap.pop();
    if (current === undefined || closed[current] === 1) {
      continue;
    }
    closed[current] = 1;
    expanded++;
    if (current === to) {
      break;
    }
    for (const [next] of mesh.links[current] ?? []) {
      const candidate = (g[current] ?? 0) + distance(current, next);
      if (candidate < (g[next] ?? 0)) {
        g[next] = candidate;
        parent[next] = current;
        heap.push(next, candidate + distance(next, to));
      }
    }
  }
  const corridor: number[] = [];
  if (closed[to] === 1) {
    for (let at = to; at >= 0; at = parent[at] ?? -1) {
      corridor.push(at);
    }
    corridor.reverse();
  }
  return { corridor, expanded };
}

export type Portal = { left: Point2; right: Point2 };

/** 通る三角形の列から、境目の辺（ポータル）を進行方向に対して左右をそろえて並べる。 */
export function portalsOf(
  mesh: NavMesh,
  corridor: readonly number[],
  start: Point2,
  goal: Point2
) {
  const portals: Portal[] = [{ left: start, right: start }];
  for (let k = 0; k < corridor.length - 1; k++) {
    const here = corridor[k] ?? 0;
    const next = corridor[k + 1] ?? 0;
    const link = mesh.links[here]?.find(([other]) => other === next);
    if (!link) {
      continue;
    }
    const a = mesh.vertices[link[1]] ?? { x: 0, y: 0 };
    const b = mesh.vertices[link[2]] ?? { x: 0, y: 0 };
    const c = mesh.centroids[here] ?? { x: 0, y: 0 };
    // 三角形の中から辺を見て、左手側にある端点を left にする
    const leftIsA = cross(c, b, a) > 0;
    portals.push(leftIsA ? { left: a, right: b } : { left: b, right: a });
  }
  portals.push({ left: goal, right: goal });
  return portals;
}

export type FunnelStep = {
  apex: Point2;
  left: Point2;
  right: Point2;
  portal: number;
  path: Point2[];
};

const same = (a: Point2, b: Point2) =>
  Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9;

/**
 * ファネル法（Simple Stupid Funnel Algorithm, Mononen）。
 * 頂点（apex）から左右の境界を張り、ポータルを 1 つずつ見て漏斗を狭めていく。
 * 片側が反対側を越えたら、越えられた側の点を曲がり角として経路に加え、そこから探し直す。
 */
export function funnel(portals: readonly Portal[]) {
  const [first] = portals;
  if (!first) {
    return { path: [] as Point2[], steps: [] as FunnelStep[] };
  }
  const path: Point2[] = [first.left];
  const steps: FunnelStep[] = [];
  let apex = first.left;
  let { left, right } = first;
  let apexIndex = 0;
  let leftIndex = 0;
  let rightIndex = 0;
  const record = (portal: number) =>
    steps.push({ apex, left, right, portal, path: [...path] });
  for (let i = 1; i < portals.length; i++) {
    const portal = portals[i];
    if (!portal) {
      continue;
    }
    // 右側の境界を内側へ狭められるか
    if (cross(apex, right, portal.right) >= 0) {
      if (same(apex, right) || cross(apex, left, portal.right) < 0) {
        ({ right } = portal);
        rightIndex = i;
      } else {
        // 右が左を越えた：左の点が曲がり角
        path.push(left);
        apex = left;
        apexIndex = leftIndex;
        right = apex;
        leftIndex = apexIndex;
        rightIndex = apexIndex;
        record(i);
        i = apexIndex;
        continue;
      }
    }
    // 左側の境界を内側へ狭められるか
    if (cross(apex, left, portal.left) <= 0) {
      if (same(apex, left) || cross(apex, right, portal.left) > 0) {
        ({ left } = portal);
        leftIndex = i;
      } else {
        path.push(right);
        apex = right;
        apexIndex = rightIndex;
        left = apex;
        leftIndex = apexIndex;
        rightIndex = apexIndex;
        record(i);
        i = apexIndex;
        continue;
      }
    }
    record(i);
  }
  const last = portals.at(-1);
  if (last && !same(path.at(-1) ?? last.left, last.left)) {
    path.push(last.left);
  }
  steps.push({
    apex,
    left,
    right,
    portal: portals.length - 1,
    path: [...path],
  });
  return { path, steps };
}

export const toVector = (p: Point2, y = 0) => new Vector3(p.x, y, p.y);

/** ナビメッシュの三角形（色分けできる）と、辺の線。 */
export function navMeshView(mesh: NavMesh, y = 0.02) {
  const group = new Group();
  const geometry = new BufferGeometry();
  const positions = new Float32Array(mesh.triangles.length * 9);
  const colors = new Float32Array(mesh.triangles.length * 9);
  for (const [index, triangle] of mesh.triangles.entries()) {
    for (let k = 0; k < 3; k++) {
      const p = mesh.vertices[triangle[k] ?? 0] ?? { x: 0, y: 0 };
      positions.set([p.x, y, p.y], index * 9 + k * 3);
    }
  }
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const fill = new Mesh(
    geometry,
    new MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.9,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      side: DoubleSide,
    })
  );
  fill.receiveShadow = true;
  const lines: Vector3[] = [];
  for (const [a, b, c] of mesh.triangles) {
    for (const [p, q] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const pp = mesh.vertices[p] ?? { x: 0, y: 0 };
      const qq = mesh.vertices[q] ?? { x: 0, y: 0 };
      lines.push(toVector(pp, y + 0.01), toVector(qq, y + 0.01));
    }
  }
  const wire = segments(lines, "#9fd3ff", { width: 1, opacity: 0.35 });
  group.add(fill, wire);
  const color = new Color();
  const tint = (index: number, value: ColorRepresentation) => {
    color.set(value);
    for (let k = 0; k < 3; k++) {
      colors.set([color.r, color.g, color.b], index * 9 + k * 3);
    }
  };
  const commit = () => {
    const attribute = geometry.getAttribute("color");
    attribute.needsUpdate = true;
  };
  const dispose = () => {
    geometry.dispose();
    fill.material.dispose();
  };
  return Object.assign(group, { tint, commit, dispose, wire, fill });
}

/** 障害物の箱（元の大きさ）。 */
export function obstacleBoxes(obstacles: readonly Rect[], height = 0.8) {
  const group = new Group();
  const material = standard("#6b7688", { roughness: 0.75 });
  for (const rect of obstacles) {
    const box = new Mesh(
      new BoxGeometry(rect.x1 - rect.x0, height, rect.y1 - rect.y0),
      material
    );
    box.position.set(
      (rect.x0 + rect.x1) / 2,
      height / 2,
      (rect.y0 + rect.y1) / 2
    );
    box.castShadow = true;
    box.receiveShadow = true;
    group.add(box);
  }
  return group;
}

/** ナビメッシュのデモで共通に使う地図。 */
export const NAV_BOUNDS: Rect = { x0: -7, y0: -4.5, x1: 7, y1: 4.5 };
export const NAV_OBSTACLES: readonly Rect[] = [
  { x0: -5, y0: -3, x1: -3.5, y1: 1.5 },
  { x0: -2, y0: -1, x1: 2, y1: 0 },
  { x0: -2, y0: 1.5, x1: -0.5, y1: 4.5 },
  { x0: 3, y0: -4.5, x1: 4, y1: 1 },
  { x0: 4.5, y0: 2, x1: 6.5, y1: 3 },
  { x0: 0.5, y0: 2, x1: 2, y1: 3.2 },
];
