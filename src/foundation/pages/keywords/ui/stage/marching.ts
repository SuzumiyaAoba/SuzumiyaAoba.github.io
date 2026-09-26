import {
  edgeTable,
  triTable,
} from "three/examples/jsm/objects/MarchingCubes.js";

/**
 * 立方体の 8 つの角（Paul Bourke の表の並び）。
 * 角 i の値が等値より大きい（内側）とき、ケース番号の i ビット目を立てる。
 */
export const CUBE_CORNERS = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 1],
] as const;

/** 12 本の辺がつなぐ角の番号。 */
export const CUBE_EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
] as const;

export type ScalarGrid = {
  /** 各軸の標本点の数。 */
  nx: number;
  ny: number;
  nz: number;
  /** 標本点の値（x が最も速く変わる並び）。 */
  values: Float32Array;
  /** 標本点 (0,0,0) の位置と、標本点の間隔。 */
  origin: readonly [number, number, number];
  spacing: number;
};

export function scalarGrid(
  nx: number,
  ny: number,
  nz: number,
  origin: readonly [number, number, number],
  spacing: number
): ScalarGrid {
  return {
    nx,
    ny,
    nz,
    values: new Float32Array(nx * ny * nz),
    origin,
    spacing,
  };
}

/** 各標本点の位置で関数を評価して値を埋める。 */
export function fillGrid(
  grid: ScalarGrid,
  field: (x: number, y: number, z: number) => number
) {
  const { nx, ny, nz, values, origin, spacing } = grid;
  for (let k = 0; k < nz; k++) {
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        values[i + nx * (j + ny * k)] = field(
          origin[0] + i * spacing,
          origin[1] + j * spacing,
          origin[2] + k * spacing
        );
      }
    }
  }
}

export type MarchedMesh = {
  positions: Float32Array;
  normals: Float32Array;
  triangles: number;
  activeCells: number;
};

/**
 * マーチングキューブ：値が iso を超える領域の境界を三角形で取り出す。
 * 頂点は辺の両端の値から線形補間し、法線は値の勾配（中心差分）から作る。
 * interpolate を false にすると、辺の中点に頂点を置く（補間の効果を比べる用）。
 */
export function marchCubes(
  grid: ScalarGrid,
  iso: number,
  interpolate = true
): MarchedMesh {
  const { nx, ny, nz, values, origin, spacing } = grid;
  const at = (i: number, j: number, k: number) =>
    values[
      Math.min(nx - 1, Math.max(0, i)) +
        nx *
          (Math.min(ny - 1, Math.max(0, j)) +
            ny * Math.min(nz - 1, Math.max(0, k)))
    ] ?? 0;
  const positions: number[] = [];
  const normals: number[] = [];
  const cornerValue = new Float64Array(8);
  const edgePoint = new Float64Array(36);
  const edgeNormal = new Float64Array(36);
  let activeCells = 0;
  const gradient = (
    i: number,
    j: number,
    k: number,
    out: Float64Array,
    offset: number,
    weight: number
  ) => {
    // 値が増える向きの反対（外向き）を法線にする
    out[offset] =
      (out[offset] ?? 0) - (at(i + 1, j, k) - at(i - 1, j, k)) * weight;
    out[offset + 1] =
      (out[offset + 1] ?? 0) - (at(i, j + 1, k) - at(i, j - 1, k)) * weight;
    out[offset + 2] =
      (out[offset + 2] ?? 0) - (at(i, j, k + 1) - at(i, j, k - 1)) * weight;
  };
  for (let k = 0; k < nz - 1; k++) {
    for (let j = 0; j < ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        let cubeIndex = 0;
        for (const [corner, [dx, dy, dz]] of CUBE_CORNERS.entries()) {
          const value = at(i + dx, j + dy, k + dz);
          cornerValue[corner] = value;
          if (value > iso) {
            cubeIndex |= 1 << corner;
          }
        }
        const bits = edgeTable[cubeIndex] ?? 0;
        if (bits === 0) {
          continue;
        }
        activeCells++;
        for (const [edge, [a, b]] of CUBE_EDGES.entries()) {
          if ((bits & (1 << edge)) === 0) {
            continue;
          }
          const va = cornerValue[a] ?? 0;
          const vb = cornerValue[b] ?? 0;
          const t =
            interpolate && Math.abs(vb - va) > 1e-9
              ? (iso - va) / (vb - va)
              : 0.5;
          const ca = CUBE_CORNERS[a] ?? CUBE_CORNERS[0];
          const cb = CUBE_CORNERS[b] ?? CUBE_CORNERS[0];
          const offset = edge * 3;
          for (let axis = 0; axis < 3; axis++) {
            const cellCoordinate = [i, j, k][axis] ?? 0;
            const pa = cellCoordinate + (ca[axis] ?? 0);
            const pb = cellCoordinate + (cb[axis] ?? 0);
            edgePoint[offset + axis] =
              (origin[axis] ?? 0) + (pa + (pb - pa) * t) * spacing;
            edgeNormal[offset + axis] = 0;
          }
          gradient(i + ca[0], j + ca[1], k + ca[2], edgeNormal, offset, 1 - t);
          gradient(i + cb[0], j + cb[1], k + cb[2], edgeNormal, offset, t);
        }
        const base = cubeIndex * 16;
        for (let n = 0; n < 16; n += 3) {
          const e0 = triTable[base + n] ?? -1;
          if (e0 < 0) {
            break;
          }
          const e1 = triTable[base + n + 1] ?? 0;
          const e2 = triTable[base + n + 2] ?? 0;
          // 表の三角形は内側から見て反時計回りなので、外から見て反時計回りになるよう並べ替える
          for (const edge of [e0, e2, e1]) {
            const offset = edge * 3;
            positions.push(
              edgePoint[offset] ?? 0,
              edgePoint[offset + 1] ?? 0,
              edgePoint[offset + 2] ?? 0
            );
            const gx = edgeNormal[offset] ?? 0;
            const gy = edgeNormal[offset + 1] ?? 0;
            const gz = edgeNormal[offset + 2] ?? 0;
            const length = Math.hypot(gx, gy, gz) || 1;
            normals.push(gx / length, gy / length, gz / length);
          }
        }
      }
    }
  }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    triangles: positions.length / 9,
    activeCells,
  };
}

/** マーチングスクエアの 16 通りのケースで、線を引く辺の組（辺 0: 下, 1: 右, 2: 上, 3: 左）。 */
export const SQUARE_SEGMENTS: readonly (readonly [number, number])[][] = [
  [],
  [[3, 0]],
  [[0, 1]],
  [[3, 1]],
  [[1, 2]],
  [
    [3, 2],
    [1, 0],
  ],
  [[0, 2]],
  [[3, 2]],
  [[2, 3]],
  [[2, 0]],
  [
    [0, 3],
    [2, 1],
  ],
  [[2, 1]],
  [[1, 3]],
  [[1, 0]],
  [[0, 3]],
  [],
];

/** マーチングスクエアの 4 つの角（左下から反時計回り）。角 i が内側なら i ビット目を立てる。 */
export const SQUARE_CORNERS = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
] as const;

export type MarchedContour = {
  /** 輪郭の線分（x0, y0, x1, y1 の並び）。 */
  lines: number[];
  /** 内側の塗り（三角形の x, y の並び）。 */
  fill: number[];
  /** セルごとのケース番号。 */
  cases: Uint8Array;
};

/**
 * マーチングスクエア：2 次元の格子の値から、iso を境にした輪郭線と内側の塗りを作る。
 * values は (nx × ny) 個の格子点の値（x が速く変わる並び）。
 */
export function marchSquares(
  values: Float32Array,
  nx: number,
  ny: number,
  origin: readonly [number, number],
  spacing: number,
  iso: number,
  interpolate = true
): MarchedContour {
  const lines: number[] = [];
  const fill: number[] = [];
  const cases = new Uint8Array((nx - 1) * (ny - 1));
  const corner = new Float64Array(4);
  const edgeX = new Float64Array(4);
  const edgeY = new Float64Array(4);
  const polygon: number[] = [];
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      let index = 0;
      for (const [c, [dx, dy]] of SQUARE_CORNERS.entries()) {
        const value = values[i + dx + nx * (j + dy)] ?? 0;
        corner[c] = value;
        if (value > iso) {
          index |= 1 << c;
        }
      }
      cases[i + (nx - 1) * j] = index;
      if (index === 0) {
        continue;
      }
      // 辺 e は角 e と角 (e+1)%4 を結ぶ
      for (let e = 0; e < 4; e++) {
        const a = e;
        const b = (e + 1) % 4;
        const va = corner[a] ?? 0;
        const vb = corner[b] ?? 0;
        const t =
          interpolate && Math.abs(vb - va) > 1e-9
            ? (iso - va) / (vb - va)
            : 0.5;
        const [ax, ay] = SQUARE_CORNERS[a] ?? SQUARE_CORNERS[0];
        const [bx, by] = SQUARE_CORNERS[b] ?? SQUARE_CORNERS[0];
        edgeX[e] = origin[0] + (i + ax + (bx - ax) * t) * spacing;
        edgeY[e] = origin[1] + (j + ay + (by - ay) * t) * spacing;
      }
      for (const [e0, e1] of SQUARE_SEGMENTS[index] ?? []) {
        lines.push(
          edgeX[e0] ?? 0,
          edgeY[e0] ?? 0,
          edgeX[e1] ?? 0,
          edgeY[e1] ?? 0
        );
      }
      // 塗り：角と辺の点を反時計回りにたどり、内側の角と境界の点だけで多角形を作る
      polygon.length = 0;
      for (let c = 0; c < 4; c++) {
        const inside = (index & (1 << c)) !== 0;
        const nextInside = (index & (1 << ((c + 1) % 4))) !== 0;
        if (inside) {
          const [cx, cy] = SQUARE_CORNERS[c] ?? SQUARE_CORNERS[0];
          polygon.push(
            origin[0] + (i + cx) * spacing,
            origin[1] + (j + cy) * spacing
          );
        }
        if (inside !== nextInside) {
          polygon.push(edgeX[c] ?? 0, edgeY[c] ?? 0);
        }
      }
      for (let p = 2; p + 3 < polygon.length; p += 2) {
        fill.push(
          polygon[0] ?? 0,
          polygon[1] ?? 0,
          polygon[p] ?? 0,
          polygon[p + 1] ?? 0,
          polygon[p + 2] ?? 0,
          polygon[p + 3] ?? 0
        );
      }
    }
  }
  return { lines, fill, cases };
}
