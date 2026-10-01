import {
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Vector3,
} from "three";
import type { ColorRepresentation } from "three";
import { standard } from "./kit";
import { walkPose } from "./mannequin";
import type { Mannequin } from "./mannequin";

/** 格子の地図。セル番号は row * cols + col。x は列、z は行の向き。 */
export type GridMap = {
  cols: number;
  rows: number;
  cell: number;
  /** 0 = 通れる、1 = 壁。 */
  blocked: Uint8Array;
  /** 1 マス進むコスト（通れるセルのみ意味を持つ）。 */
  cost: Float32Array;
  /** 地形の種類（文字）。 */
  kind: string[];
};

export const TERRAIN: Record<
  string,
  { cost: number; color: string; name: string }
> = {
  ".": { cost: 1, color: "#2a3646", name: "平地" },
  ",": { cost: 2, color: "#2d5a3c", name: "林" },
  "~": { cost: 4, color: "#4d4330", name: "沼" },
};

/** 文字列の地図を読む。「#」は壁、それ以外は TERRAIN の地形。 */
export function parseMap(lines: readonly string[], cell = 0.5): GridMap {
  const rows = lines.length;
  const cols = Math.max(...lines.map((line) => line.length));
  const blocked = new Uint8Array(cols * rows);
  const cost = new Float32Array(cols * rows).fill(1);
  const kind: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = lines[r]?.charAt(c) || ".";
      const index = r * cols + c;
      kind[index] = ch;
      if (ch === "#") {
        blocked[index] = 1;
      } else {
        cost[index] = TERRAIN[ch]?.cost ?? 1;
      }
    }
  }
  return { cols, rows, cell, blocked, cost, kind };
}

export const colOf = (map: GridMap, index: number) => index % map.cols;
export const rowOf = (map: GridMap, index: number) =>
  Math.floor(index / map.cols);

/** セルの中心（地図の中心が原点、y = 0）。 */
export function cellCenter(map: GridMap, index: number, out = new Vector3()) {
  return out.set(
    (colOf(map, index) - (map.cols - 1) / 2) * map.cell,
    0,
    (rowOf(map, index) - (map.rows - 1) / 2) * map.cell
  );
}

/** 位置を含むセル（地図の外なら -1）。 */
export function cellAt(map: GridMap, x: number, z: number) {
  const c = Math.round(x / map.cell + (map.cols - 1) / 2);
  const r = Math.round(z / map.cell + (map.rows - 1) / 2);
  if (c < 0 || r < 0 || c >= map.cols || r >= map.rows) {
    return -1;
  }
  return r * map.cols + c;
}

export const walkable = (map: GridMap, index: number) =>
  index >= 0 && index < map.blocked.length && map.blocked[index] === 0;

const STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const;

/** 隣のセルと、そこへ進むコスト（移動先の地形コスト × 距離）。斜めは角をすり抜けない。 */
export function neighbors(map: GridMap, index: number, diagonal: boolean) {
  const c = colOf(map, index);
  const r = rowOf(map, index);
  const result: [number, number][] = [];
  for (const [dc, dr] of STEPS) {
    const isDiagonal = dc !== 0 && dr !== 0;
    if (isDiagonal && !diagonal) {
      continue;
    }
    const nc = c + dc;
    const nr = r + dr;
    if (nc < 0 || nr < 0 || nc >= map.cols || nr >= map.rows) {
      continue;
    }
    const next = nr * map.cols + nc;
    if (!walkable(map, next)) {
      continue;
    }
    if (
      isDiagonal &&
      (!walkable(map, r * map.cols + nc) || !walkable(map, nr * map.cols + c))
    ) {
      continue;
    }
    result.push([next, (map.cost[next] ?? 1) * (isDiagonal ? Math.SQRT2 : 1)]);
  }
  return result;
}

/** 優先度付きキュー（二分ヒープ）。同じ要素を何度入れてもよい（古いものは取り出し側で捨てる）。 */
export class MinHeap {
  private readonly items: number[] = [];
  private readonly keys: number[] = [];
  get size() {
    return this.items.length;
  }
  push(item: number, key: number) {
    this.items.push(item);
    this.keys.push(key);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if ((this.keys[parent] ?? 0) <= key) {
        break;
      }
      this.swap(i, parent);
      i = parent;
    }
  }
  pop() {
    const [top] = this.items;
    const lastItem = this.items.pop();
    const lastKey = this.keys.pop();
    if (
      this.items.length > 0 &&
      lastItem !== undefined &&
      lastKey !== undefined
    ) {
      this.items[0] = lastItem;
      this.keys[0] = lastKey;
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        const right = left + 1;
        let smallest = i;
        if (
          left < this.items.length &&
          (this.keys[left] ?? 0) < (this.keys[smallest] ?? 0)
        ) {
          smallest = left;
        }
        if (
          right < this.items.length &&
          (this.keys[right] ?? 0) < (this.keys[smallest] ?? 0)
        ) {
          smallest = right;
        }
        if (smallest === i) {
          break;
        }
        this.swap(i, smallest);
        i = smallest;
      }
    }
    return top;
  }
  private swap(a: number, b: number) {
    const item = this.items[a] ?? 0;
    const key = this.keys[a] ?? 0;
    this.items[a] = this.items[b] ?? 0;
    this.keys[a] = this.keys[b] ?? 0;
    this.items[b] = item;
    this.keys[b] = key;
  }
}

/** 斜め移動ありの格子での、最小コスト 1 の場合の距離の見積もり（オクタイル距離）。 */
export function octile(map: GridMap, a: number, b: number, diagonal: boolean) {
  const dx = Math.abs(colOf(map, a) - colOf(map, b));
  const dy = Math.abs(rowOf(map, a) - rowOf(map, b));
  return diagonal ? dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy) : dx + dy;
}

export type SearchMode = "dijkstra" | "astar" | "greedy";

/**
 * 格子の上で経路を探す。アニメーション用に、各セルが開いた（候補に入った）順番と、
 * 閉じた（確定した）順番を記録する。goal が -1 なら全体を調べる（ダイクストラ法の距離の場）。
 */
export function gridSearch(
  map: GridMap,
  sources: readonly number[],
  goal: number,
  options: {
    mode: SearchMode;
    diagonal: boolean;
    weight?: number;
    limit?: number;
  }
) {
  const n = map.cols * map.rows;
  const g = new Float32Array(n).fill(Number.POSITIVE_INFINITY);
  const parent = new Int32Array(n).fill(-1);
  const openedAt = new Int32Array(n).fill(-1);
  const closedAt = new Int32Array(n).fill(-1);
  const heap = new MinHeap();
  const weight = options.weight ?? 1;
  const limit = options.limit ?? Number.POSITIVE_INFINITY;
  const h = (index: number) =>
    goal < 0 ? 0 : octile(map, index, goal, options.diagonal);
  const priority = (index: number) => {
    switch (options.mode) {
      case "dijkstra": {
        return g[index] ?? 0;
      }
      case "greedy": {
        return h(index);
      }
      case "astar": {
        return (g[index] ?? 0) + weight * h(index);
      }
      default: {
        return g[index] ?? 0;
      }
    }
  };
  let step = 0;
  for (const source of sources) {
    g[source] = 0;
    openedAt[source] = 0;
    heap.push(source, priority(source));
  }
  const order: number[] = [];
  while (heap.size > 0) {
    const current = heap.pop();
    if (current === undefined || (closedAt[current] ?? -1) >= 0) {
      continue;
    }
    step++;
    closedAt[current] = step;
    order.push(current);
    if (current === goal) {
      break;
    }
    for (const [next, stepCost] of neighbors(map, current, options.diagonal)) {
      if ((closedAt[next] ?? -1) >= 0) {
        continue;
      }
      const candidate = (g[current] ?? 0) + stepCost;
      if (candidate < (g[next] ?? 0) && candidate <= limit) {
        g[next] = candidate;
        parent[next] = current;
        if ((openedAt[next] ?? -1) < 0) {
          openedAt[next] = step;
        }
        heap.push(next, priority(next));
      }
    }
  }
  const path: number[] = [];
  if (goal >= 0 && (closedAt[goal] ?? -1) >= 0) {
    for (let at = goal; at >= 0; at = parent[at] ?? -1) {
      path.push(at);
    }
    path.reverse();
  }
  return { g, parent, openedAt, closedAt, order, path, steps: step };
}

/** 格子の床と壁を描く。tint でセルの色を上書きできる（null で地形の色に戻す）。 */
export function gridView(map: GridMap, options: { wallHeight?: number } = {}) {
  const group = new Group();
  const n = map.cols * map.rows;
  const tileGeometry = new BoxGeometry(map.cell * 0.94, 0.06, map.cell * 0.94);
  const tiles = new InstancedMesh(
    tileGeometry,
    standard("#ffffff", { roughness: 0.85 }),
    n
  );
  tiles.receiveShadow = true;
  const wallHeight = options.wallHeight ?? 0.7;
  const wallGeometry = new BoxGeometry(map.cell, wallHeight, map.cell);
  const wallCount = map.blocked.reduce((sum, value) => sum + value, 0);
  const walls = new InstancedMesh(
    wallGeometry,
    standard("#6b7688", { roughness: 0.75 }),
    Math.max(1, wallCount)
  );
  walls.castShadow = true;
  walls.receiveShadow = true;
  const matrix = new Matrix4();
  const center = new Vector3();
  const color = new Color();
  let wall = 0;
  for (let index = 0; index < n; index++) {
    cellCenter(map, index, center);
    if (map.blocked[index] === 1) {
      matrix.makeTranslation(center.x, wallHeight / 2, center.z);
      walls.setMatrixAt(wall++, matrix);
      matrix.makeScale(0, 0, 0);
      tiles.setMatrixAt(index, matrix);
    } else {
      matrix.makeTranslation(center.x, -0.03, center.z);
      tiles.setMatrixAt(index, matrix);
    }
    tiles.setColorAt(
      index,
      color.set(TERRAIN[map.kind[index] ?? "."]?.color ?? "#2a3646")
    );
  }
  walls.count = wallCount;
  group.add(tiles, walls);
  const base = (index: number) =>
    color.set(TERRAIN[map.kind[index] ?? "."]?.color ?? "#2a3646");
  const tint = (
    index: number,
    value: ColorRepresentation | null,
    amount = 1
  ) => {
    const terrain = base(index).clone();
    tiles.setColorAt(
      index,
      value === null ? terrain : terrain.lerp(new Color(value), amount)
    );
  };
  const reset = () => {
    for (let index = 0; index < n; index++) {
      tiles.setColorAt(index, base(index));
    }
  };
  const commit = () => {
    if (tiles.instanceColor) {
      tiles.instanceColor.needsUpdate = true;
    }
  };
  const dispose = () => {
    tileGeometry.dispose();
    wallGeometry.dispose();
    tiles.dispose();
    walls.dispose();
  };
  return Object.assign(group, { tint, reset, commit, dispose, tiles, walls });
}

/**
 * マネキンを折れ線に沿って歩かせる。setPath で道を差し替え、update で進める。
 * 返り値の done は終点に着いたかどうか。
 */
export function walker(
  man: Mannequin,
  options: { speed?: number; scale?: number } = {}
) {
  const scale = options.scale ?? 0.55;
  man.root.scale.setScalar(scale);
  let points: Vector3[] = [];
  let segment = 0;
  let travelled = 0;
  let phase = 0;
  let heading = 0;
  const direction = new Vector3();
  const setPath = (next: readonly Vector3[]) => {
    points = next.map((point) => point.clone());
    segment = 0;
    const [first] = points;
    if (first) {
      man.root.position.copy(first);
    }
  };
  const update = (dt: number, speed = options.speed ?? 1.2) => {
    let remaining = speed * dt;
    let moved = 0;
    while (remaining > 0 && segment < points.length - 1) {
      const target = points[segment + 1];
      if (!target) {
        break;
      }
      direction.subVectors(target, man.root.position).setY(0);
      const distance = direction.length();
      if (distance <= remaining) {
        man.root.position.copy(target);
        remaining -= distance;
        moved += distance;
        segment++;
      } else {
        direction.divideScalar(distance);
        man.root.position.addScaledVector(direction, remaining);
        moved += remaining;
        remaining = 0;
      }
      if (distance > 1e-4) {
        const desired = Math.atan2(direction.x, direction.z);
        let delta = desired - heading;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta));
        heading += delta * Math.min(1, dt * 10);
      }
    }
    man.root.rotation.y = heading;
    travelled += moved;
    const walking = moved > 1e-5;
    phase = (phase + moved / (scale * 1.3)) % 1;
    if (walking) {
      walkPose(man, phase, 0.9);
    } else {
      man.rest();
    }
    return { done: segment >= points.length - 1, travelled };
  };
  const face = (target: Vector3) => {
    heading = Math.atan2(
      target.x - man.root.position.x,
      target.z - man.root.position.z
    );
    man.root.rotation.y = heading;
  };
  return {
    setPath,
    update,
    face,
    get position() {
      return man.root.position;
    },
  };
}
