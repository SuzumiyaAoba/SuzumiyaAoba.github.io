/** 2 次元の点（x, y）。 */
export type Point2 = { x: number; y: number };
export type Triangle = [number, number, number];
export type Circle = { x: number; y: number; r: number };

/** 3 点を通る円（外接円）。3 点が一直線に近いときは半径が非常に大きくなる。 */
export function circumcircle(a: Point2, b: Point2, c: Point2): Circle {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-12) {
    return { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3, r: 1e9 };
  }
  const a2 = a.x * a.x + a.y * a.y;
  const b2 = b.x * b.x + b.y * b.y;
  const c2 = c.x * c.x + c.y * c.y;
  const x = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d;
  const y = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d;
  return { x, y, r: Math.hypot(a.x - x, a.y - y) };
}

/** 1 点を追加したときの様子（アニメーション用）。 */
export type InsertStep = {
  point: number;
  /** 外接円の中に新しい点が入ってしまった三角形（取り除く）。 */
  bad: Triangle[];
  /** 取り除いた穴のふち（新しい点とつなぐ辺）。 */
  boundary: [number, number][];
  /** 追加後の三角形（外側の大きな三角形を含む）。 */
  after: Triangle[];
};

/**
 * ボウヤー・ワトソン法：点を 1 つずつ追加し、外接円に新しい点を含む三角形を取り除いて、
 * できた穴のふちと新しい点をつなぎ直す。最初は全部の点を囲む大きな三角形から始める。
 * 返す三角形の頂点番号は points の番号（大きな三角形の頂点は points.length 以降）。
 */
export function delaunaySteps(points: readonly Point2[]) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  const size = Math.max(maxX - minX, maxY - minY, 1) * 20;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const all: Point2[] = [
    ...points,
    { x: cx - size, y: cy - size },
    { x: cx + size, y: cy - size },
    { x: cx, y: cy + size },
  ];
  const n = points.length;
  let triangles: { t: Triangle; circle: Circle }[] = [];
  const at = (index: number): Point2 => all[index] ?? { x: 0, y: 0 };
  const make = (t: Triangle) => ({
    t,
    circle: circumcircle(at(t[0]), at(t[1]), at(t[2])),
  });
  triangles.push(make([n, n + 1, n + 2]));
  const steps: InsertStep[] = [];
  for (let index = 0; index < n; index++) {
    const p = all[index];
    if (!p) {
      continue;
    }
    const bad: typeof triangles = [];
    const keep: typeof triangles = [];
    for (const triangle of triangles) {
      const { circle } = triangle;
      if (
        (p.x - circle.x) ** 2 + (p.y - circle.y) ** 2 <
        circle.r * circle.r * (1 - 1e-9)
      ) {
        bad.push(triangle);
      } else {
        keep.push(triangle);
      }
    }
    // 取り除いた三角形の辺のうち、ほかの取り除いた三角形と共有していない辺が穴のふち
    const edgeCount = new Map<string, [number, number]>();
    const counts = new Map<string, number>();
    for (const { t } of bad) {
      for (const [a, b] of [
        [t[0], t[1]],
        [t[1], t[2]],
        [t[2], t[0]],
      ] as const) {
        const key = a < b ? `${a},${b}` : `${b},${a}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
        edgeCount.set(key, [a, b]);
      }
    }
    const boundary: [number, number][] = [];
    for (const [key, edge] of edgeCount) {
      if (counts.get(key) === 1) {
        boundary.push(edge);
      }
    }
    for (const [a, b] of boundary) {
      keep.push(make([a, b, index]));
    }
    triangles = keep;
    steps.push({
      point: index,
      bad: bad.map(({ t }) => t),
      boundary,
      after: triangles.map(({ t }) => t),
    });
  }
  const final = triangles
    .map(({ t }) => t)
    .filter((t) => t[0] < n && t[1] < n && t[2] < n);
  return { steps, triangles: final, all };
}

/** 三角形の辺（重複なし）。 */
export function uniqueEdges(triangles: readonly Triangle[]) {
  const edges = new Map<string, [number, number]>();
  for (const t of triangles) {
    for (const [a, b] of [
      [t[0], t[1]],
      [t[1], t[2]],
      [t[2], t[0]],
    ] as const) {
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      edges.set(key, a < b ? [a, b] : [b, a]);
    }
  }
  return [...edges.values()];
}

/** クラスカル法の最小全域木（辺の長さが短い順に、輪ができない辺だけ採用する）。 */
export function minimumSpanningTree(
  points: readonly Point2[],
  edges: readonly [number, number][]
) {
  const parent = points.map((_, index) => index);
  const find = (value: number): number => {
    let root = value;
    while (parent[root] !== root) {
      root = parent[root] ?? root;
    }
    parent[value] = root;
    return root;
  };
  const length = ([a, b]: [number, number]) => {
    const pa = points[a];
    const pb = points[b];
    return pa && pb ? Math.hypot(pa.x - pb.x, pa.y - pb.y) : 0;
  };
  const sorted = edges.toSorted((e1, e2) => length(e1) - length(e2));
  const tree: [number, number][] = [];
  const rest: [number, number][] = [];
  for (const edge of sorted) {
    const ra = find(edge[0]);
    const rb = find(edge[1]);
    if (ra === rb) {
      rest.push(edge);
    } else {
      parent[ra] = rb;
      tree.push(edge);
    }
  }
  return { tree, rest };
}

/** 三角形の最小の内角（度）。 */
export function minimumAngle(
  points: readonly Point2[],
  triangles: readonly Triangle[]
) {
  let smallest = 180;
  for (const t of triangles) {
    for (let corner = 0; corner < 3; corner++) {
      const p = points[t[corner] ?? 0];
      const q = points[t[(corner + 1) % 3] ?? 0];
      const r = points[t[(corner + 2) % 3] ?? 0];
      if (!p || !q || !r) {
        continue;
      }
      const ux = q.x - p.x;
      const uy = q.y - p.y;
      const vx = r.x - p.x;
      const vy = r.y - p.y;
      const angle = Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1)
          )
        )
      );
      smallest = Math.min(smallest, (angle * 180) / Math.PI);
    }
  }
  return smallest;
}
