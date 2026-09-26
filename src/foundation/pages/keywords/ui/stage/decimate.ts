/**
 * 二次誤差（QEM, Garland & Heckbert 1997）による辺の縮約。
 * 辺を 1 本ずつ点に縮めていき、その順番（縮約の列）を記録する。
 * 列を先頭から k 個だけ適用すれば、好きな面数の形をすぐに作れる（プログレッシブメッシュ）。
 */

type Quadric = Float64Array; // 対称 4×4 行列の上三角 10 要素

const quadric = () => new Float64Array(10);

function addPlane(
  q: Quadric,
  a: number,
  b: number,
  c: number,
  d: number,
  weight: number
) {
  q[0] = (q[0] ?? 0) + a * a * weight;
  q[1] = (q[1] ?? 0) + a * b * weight;
  q[2] = (q[2] ?? 0) + a * c * weight;
  q[3] = (q[3] ?? 0) + a * d * weight;
  q[4] = (q[4] ?? 0) + b * b * weight;
  q[5] = (q[5] ?? 0) + b * c * weight;
  q[6] = (q[6] ?? 0) + b * d * weight;
  q[7] = (q[7] ?? 0) + c * c * weight;
  q[8] = (q[8] ?? 0) + c * d * weight;
  q[9] = (q[9] ?? 0) + d * d * weight;
}

/** 点 (x, y, z) の二次誤差 vᵀQv。 */
function evaluate(q: Quadric, x: number, y: number, z: number) {
  const [
    q0 = 0,
    q1 = 0,
    q2 = 0,
    q3 = 0,
    q4 = 0,
    q5 = 0,
    q6 = 0,
    q7 = 0,
    q8 = 0,
    q9 = 0,
  ] = q;
  return (
    q0 * x * x +
    2 * q1 * x * y +
    2 * q2 * x * z +
    2 * q3 * x +
    q4 * y * y +
    2 * q5 * y * z +
    2 * q6 * y +
    q7 * z * z +
    2 * q8 * z +
    q9
  );
}

/** 誤差が最小になる位置（3×3 の連立方程式）。解けなければ null。 */
function optimal(q: Quadric): [number, number, number] | null {
  const [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, h = 0, i = 0] = q;
  // | a b c | |x|   |-d|
  // | b e f | |y| = |-g|
  // | c f h | |z|   |-i|
  const det = a * (e * h - f * f) - b * (b * h - f * c) + c * (b * f - e * c);
  if (Math.abs(det) < 1e-10) {
    return null;
  }
  const x =
    (-d * (e * h - f * f) - b * (-g * h + f * i) + c * (-g * f + e * i)) / det;
  const y =
    (a * (-g * h + f * i) + d * (b * h - f * c) + c * (-b * i + g * c)) / det;
  const z =
    (a * (e * -i + g * f) - b * (b * -i + g * c) - d * (b * f - e * c)) / det;
  return [x, y, z];
}

/** 3 点が作る三角形の法線（正規化しない）。 */
function triangleNormal(r: number[][]) {
  const [r0 = [0, 0, 0], r1 = [0, 0, 0], r2 = [0, 0, 0]] = r;
  const ux = (r1[0] ?? 0) - (r0[0] ?? 0);
  const uy = (r1[1] ?? 0) - (r0[1] ?? 0);
  const uz = (r1[2] ?? 0) - (r0[2] ?? 0);
  const vx = (r2[0] ?? 0) - (r0[0] ?? 0);
  const vy = (r2[1] ?? 0) - (r0[1] ?? 0);
  const vz = (r2[2] ?? 0) - (r0[2] ?? 0);
  return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
}

export type Collapse = {
  keep: number;
  remove: number;
  x: number;
  y: number;
  z: number;
  cost: number;
  triangles: number;
};

/** 最小ヒープ（辺の誤差が小さい順に取り出す）。 */
class Heap {
  private readonly items: {
    cost: number;
    a: number;
    b: number;
    stamp: number;
  }[] = [];

  push(item: { cost: number; a: number; b: number; stamp: number }) {
    const { items } = this;
    items.push(item);
    let index = items.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      const p = items[parent];
      if (!p || p.cost <= item.cost) {
        break;
      }
      items[index] = p;
      index = parent;
    }
    items[index] = item;
  }

  pop() {
    const { items } = this;
    const [top] = items;
    const last = items.pop();
    if (items.length > 0 && last) {
      let index = 0;
      for (;;) {
        const left = index * 2 + 1;
        const right = left + 1;
        let smallest = index;
        let smallestCost = last.cost;
        const l = items[left];
        const r = items[right];
        if (l && l.cost < smallestCost) {
          smallest = left;
          smallestCost = l.cost;
        }
        if (r && r.cost < smallestCost) {
          smallest = right;
        }
        if (smallest === index) {
          break;
        }
        items[index] = items[smallest] ?? last;
        index = smallest;
      }
      items[index] = last;
    }
    return top;
  }

  get size() {
    return this.items.length;
  }
}

/**
 * positions（x, y, z の並び）と triangles（3 つずつの頂点番号）から、縮約の列を作る。
 * 面が裏返る縮約はしない。境界の辺には、面に垂直な平面の誤差を足して形を保つ。
 */
export function qemSequence(
  positions: Float32Array,
  triangles: Uint32Array,
  minTriangles = 8
) {
  const vertexCount = positions.length / 3;
  const pos = Float64Array.from(positions);
  const tris = Int32Array.from(triangles);
  const triCount = tris.length / 3;
  const alive = new Uint8Array(triCount).fill(1);
  const vertexTris = Array.from(
    { length: vertexCount },
    () => new Set<number>()
  );
  for (let t = 0; t < triCount; t++) {
    for (let k = 0; k < 3; k++) {
      vertexTris[tris[t * 3 + k] ?? 0]?.add(t);
    }
  }
  const quadrics = Array.from({ length: vertexCount }, quadric);
  const edgeUse = new Map<string, number>();
  for (let t = 0; t < triCount; t++) {
    const a = tris[t * 3] ?? 0;
    const b = tris[t * 3 + 1] ?? 0;
    const c = tris[t * 3 + 2] ?? 0;
    const ux = (pos[b * 3] ?? 0) - (pos[a * 3] ?? 0);
    const uy = (pos[b * 3 + 1] ?? 0) - (pos[a * 3 + 1] ?? 0);
    const uz = (pos[b * 3 + 2] ?? 0) - (pos[a * 3 + 2] ?? 0);
    const vx = (pos[c * 3] ?? 0) - (pos[a * 3] ?? 0);
    const vy = (pos[c * 3 + 1] ?? 0) - (pos[a * 3 + 1] ?? 0);
    const vz = (pos[c * 3 + 2] ?? 0) - (pos[a * 3 + 2] ?? 0);
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const area = Math.hypot(nx, ny, nz);
    if (area < 1e-12) {
      continue;
    }
    nx /= area;
    ny /= area;
    nz /= area;
    const d = -(
      nx * (pos[a * 3] ?? 0) +
      ny * (pos[a * 3 + 1] ?? 0) +
      nz * (pos[a * 3 + 2] ?? 0)
    );
    for (const v of [a, b, c]) {
      addPlane(quadrics[v] ?? quadric(), nx, ny, nz, d, area);
    }
    for (const [p, q] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const key = p < q ? `${p},${q}` : `${q},${p}`;
      edgeUse.set(key, (edgeUse.get(key) ?? 0) + 1);
    }
  }
  // 境界の辺：辺を含み、面に垂直な平面を強い重みで足す（輪郭が崩れないように）
  for (let t = 0; t < triCount; t++) {
    const a = tris[t * 3] ?? 0;
    const b = tris[t * 3 + 1] ?? 0;
    const c = tris[t * 3 + 2] ?? 0;
    for (const [p, q] of [
      [a, b],
      [b, c],
      [c, a],
    ] as const) {
      const key = p < q ? `${p},${q}` : `${q},${p}`;
      if (edgeUse.get(key) !== 1) {
        continue;
      }
      const ex = (pos[q * 3] ?? 0) - (pos[p * 3] ?? 0);
      const ey = (pos[q * 3 + 1] ?? 0) - (pos[p * 3 + 1] ?? 0);
      const ez = (pos[q * 3 + 2] ?? 0) - (pos[p * 3 + 2] ?? 0);
      const fx = (pos[c * 3] ?? 0) - (pos[a * 3] ?? 0);
      const fy = (pos[c * 3 + 1] ?? 0) - (pos[a * 3 + 1] ?? 0);
      const fz = (pos[c * 3 + 2] ?? 0) - (pos[a * 3 + 2] ?? 0);
      const gx = (pos[b * 3] ?? 0) - (pos[a * 3] ?? 0);
      const gy = (pos[b * 3 + 1] ?? 0) - (pos[a * 3 + 1] ?? 0);
      const gz = (pos[b * 3 + 2] ?? 0) - (pos[a * 3 + 2] ?? 0);
      const fnx = gy * fz - gz * fy;
      const fny = gz * fx - gx * fz;
      const fnz = gx * fy - gy * fx;
      let nx = ey * fnz - ez * fny;
      let ny = ez * fnx - ex * fnz;
      let nz = ex * fny - ey * fnx;
      const length = Math.hypot(nx, ny, nz);
      if (length < 1e-12) {
        continue;
      }
      nx /= length;
      ny /= length;
      nz /= length;
      const d = -(
        nx * (pos[p * 3] ?? 0) +
        ny * (pos[p * 3 + 1] ?? 0) +
        nz * (pos[p * 3 + 2] ?? 0)
      );
      const weight = Math.hypot(ex, ey, ez) * 1000;
      addPlane(quadrics[p] ?? quadric(), nx, ny, nz, d, weight);
      addPlane(quadrics[q] ?? quadric(), nx, ny, nz, d, weight);
    }
  }

  const stamps = new Uint32Array(vertexCount);
  const removed = new Uint8Array(vertexCount);
  const heap = new Heap();
  const target = new Float64Array(3);
  const combined = quadric();
  const edgeCost = (a: number, b: number) => {
    const qa = quadrics[a] ?? quadric();
    const qb = quadrics[b] ?? quadric();
    for (let k = 0; k < 10; k++) {
      combined[k] = (qa[k] ?? 0) + (qb[k] ?? 0);
    }
    const best = optimal(combined);
    const ax = pos[a * 3] ?? 0;
    const ay = pos[a * 3 + 1] ?? 0;
    const az = pos[a * 3 + 2] ?? 0;
    const bx = pos[b * 3] ?? 0;
    const by = pos[b * 3 + 1] ?? 0;
    const bz = pos[b * 3 + 2] ?? 0;
    const candidates: [number, number, number][] = [
      [ax, ay, az],
      [bx, by, bz],
      [(ax + bx) / 2, (ay + by) / 2, (az + bz) / 2],
    ];
    // 最適な位置が辺から遠く離れる場合（ほぼ平らな所で起きやすい）は使わない
    if (
      best &&
      Math.hypot(
        best[0] - (ax + bx) / 2,
        best[1] - (ay + by) / 2,
        best[2] - (az + bz) / 2
      ) <
        Math.hypot(ax - bx, ay - by, az - bz) * 2
    ) {
      candidates.unshift(best);
    }
    let cost = Number.POSITIVE_INFINITY;
    for (const [x, y, z] of candidates) {
      const value = evaluate(combined, x, y, z);
      if (value < cost) {
        cost = value;
        target[0] = x;
        target[1] = y;
        target[2] = z;
      }
    }
    return Math.max(0, cost);
  };
  const pushEdges = (v: number) => {
    const neighbors = new Set<number>();
    for (const t of vertexTris[v] ?? []) {
      for (let k = 0; k < 3; k++) {
        const other = tris[t * 3 + k] ?? 0;
        if (other !== v) {
          neighbors.add(other);
        }
      }
    }
    for (const other of neighbors) {
      heap.push({
        cost: edgeCost(v, other),
        a: v,
        b: other,
        stamp: (stamps[v] ?? 0) + (stamps[other] ?? 0),
      });
    }
  };
  for (let v = 0; v < vertexCount; v++) {
    pushEdges(v);
  }

  /** v を新しい位置へ動かしたとき、v の周りの面が裏返らないか。 */
  const flips = (
    v: number,
    skipWith: number,
    x: number,
    y: number,
    z: number
  ) => {
    for (const t of vertexTris[v] ?? []) {
      const corners = [
        tris[t * 3] ?? 0,
        tris[t * 3 + 1] ?? 0,
        tris[t * 3 + 2] ?? 0,
      ];
      if (corners.includes(skipWith)) {
        continue; // 消える面
      }
      const p = corners.map((c) =>
        c === v
          ? [x, y, z]
          : [pos[c * 3] ?? 0, pos[c * 3 + 1] ?? 0, pos[c * 3 + 2] ?? 0]
      );
      const q = corners.map((c) => [
        pos[c * 3] ?? 0,
        pos[c * 3 + 1] ?? 0,
        pos[c * 3 + 2] ?? 0,
      ]);
      const [n0 = 0, n1 = 0, n2 = 0] = triangleNormal(p);
      const [m0 = 0, m1 = 0, m2 = 0] = triangleNormal(q);
      const lengths = Math.hypot(n0, n1, n2) * Math.hypot(m0, m1, m2);
      if (lengths < 1e-18 || (n0 * m0 + n1 * m1 + n2 * m2) / lengths < 0.2) {
        return true;
      }
    }
    return false;
  };

  const sequence: Collapse[] = [];
  let triangleCount = triCount;
  while (heap.size > 0 && triangleCount > minTriangles) {
    const item = heap.pop();
    if (!item) {
      break;
    }
    const { a, b } = item;
    if (
      removed[a] === 1 ||
      removed[b] === 1 ||
      item.stamp !== (stamps[a] ?? 0) + (stamps[b] ?? 0)
    ) {
      continue;
    }
    const cost = edgeCost(a, b);
    const [x = 0, y = 0, z = 0] = target;
    if (flips(a, b, x, y, z) || flips(b, a, x, y, z)) {
      continue;
    }
    // b を a にまとめる
    for (const t of vertexTris[b] ?? []) {
      const corners = [
        tris[t * 3] ?? 0,
        tris[t * 3 + 1] ?? 0,
        tris[t * 3 + 2] ?? 0,
      ];
      if (corners.includes(a)) {
        alive[t] = 0;
        triangleCount--;
        for (const c of corners) {
          vertexTris[c]?.delete(t);
        }
      } else {
        for (let k = 0; k < 3; k++) {
          if (tris[t * 3 + k] === b) {
            tris[t * 3 + k] = a;
          }
        }
        vertexTris[a]?.add(t);
      }
    }
    vertexTris[b]?.clear();
    removed[b] = 1;
    pos[a * 3] = x;
    pos[a * 3 + 1] = y;
    pos[a * 3 + 2] = z;
    const qa = quadrics[a] ?? quadric();
    const qb = quadrics[b] ?? quadric();
    for (let k = 0; k < 10; k++) {
      qa[k] = (qa[k] ?? 0) + (qb[k] ?? 0);
    }
    stamps[a] = (stamps[a] ?? 0) + 1;
    sequence.push({
      keep: a,
      remove: b,
      x,
      y,
      z,
      cost,
      triangles: triangleCount,
    });
    pushEdges(a);
  }
  return sequence;
}

/** 縮約の列の先頭 count 個を適用した形（三角形ごとの位置の配列）。 */
export function applyCollapses(
  positions: Float32Array,
  triangles: Uint32Array,
  sequence: readonly Collapse[],
  count: number
) {
  const vertexCount = positions.length / 3;
  const parent = new Int32Array(vertexCount);
  for (let v = 0; v < vertexCount; v++) {
    parent[v] = v;
  }
  const pos = Float32Array.from(positions);
  for (let n = 0; n < Math.min(count, sequence.length); n++) {
    const step = sequence[n];
    if (!step) {
      continue;
    }
    parent[step.remove] = step.keep;
    pos[step.keep * 3] = step.x;
    pos[step.keep * 3 + 1] = step.y;
    pos[step.keep * 3 + 2] = step.z;
  }
  const find = (v: number) => {
    let root = v;
    while (parent[root] !== root) {
      root = parent[root] ?? root;
    }
    return root;
  };
  const out: number[] = [];
  for (let t = 0; t < triangles.length; t += 3) {
    const a = find(triangles[t] ?? 0);
    const b = find(triangles[t + 1] ?? 0);
    const c = find(triangles[t + 2] ?? 0);
    if (a === b || b === c || c === a) {
      continue;
    }
    for (const v of [a, b, c]) {
      out.push(pos[v * 3] ?? 0, pos[v * 3 + 1] ?? 0, pos[v * 3 + 2] ?? 0);
    }
  }
  return new Float32Array(out);
}

/** 頂点クラスタリング：空間を格子に分け、同じマスの頂点を平均の 1 点にまとめる（比較用）。 */
export function clusterVertices(
  positions: Float32Array,
  triangles: Uint32Array,
  cells: number
) {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;
  for (let v = 0; v < positions.length; v += 3) {
    minX = Math.min(minX, positions[v] ?? 0);
    minY = Math.min(minY, positions[v + 1] ?? 0);
    minZ = Math.min(minZ, positions[v + 2] ?? 0);
    maxX = Math.max(maxX, positions[v] ?? 0);
    maxY = Math.max(maxY, positions[v + 1] ?? 0);
    maxZ = Math.max(maxZ, positions[v + 2] ?? 0);
  }
  const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ) / cells + 1e-9;
  const cellOf = new Map<string, number>();
  const sums: number[] = [];
  const counts: number[] = [];
  const mapping = new Int32Array(positions.length / 3);
  for (let v = 0; v < positions.length / 3; v++) {
    const x = positions[v * 3] ?? 0;
    const y = positions[v * 3 + 1] ?? 0;
    const z = positions[v * 3 + 2] ?? 0;
    const key = `${Math.floor((x - minX) / size)},${Math.floor((y - minY) / size)},${Math.floor((z - minZ) / size)}`;
    let cell = cellOf.get(key);
    if (cell === undefined) {
      cell = counts.length;
      cellOf.set(key, cell);
      counts.push(0);
      sums.push(0, 0, 0);
    }
    mapping[v] = cell;
    counts[cell] = (counts[cell] ?? 0) + 1;
    sums[cell * 3] = (sums[cell * 3] ?? 0) + x;
    sums[cell * 3 + 1] = (sums[cell * 3 + 1] ?? 0) + y;
    sums[cell * 3 + 2] = (sums[cell * 3 + 2] ?? 0) + z;
  }
  const out: number[] = [];
  const seen = new Set<string>();
  for (let t = 0; t < triangles.length; t += 3) {
    const a = mapping[triangles[t] ?? 0] ?? 0;
    const b = mapping[triangles[t + 1] ?? 0] ?? 0;
    const c = mapping[triangles[t + 2] ?? 0] ?? 0;
    if (a === b || b === c || c === a) {
      continue;
    }
    const key = [a, b, c].toSorted((p, q) => p - q).join(",");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    for (const cell of [a, b, c]) {
      const n = counts[cell] ?? 1;
      out.push(
        (sums[cell * 3] ?? 0) / n,
        (sums[cell * 3 + 1] ?? 0) / n,
        (sums[cell * 3 + 2] ?? 0) / n
      );
    }
  }
  return new Float32Array(out);
}
