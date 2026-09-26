import {
  BoxGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import { palette, rng } from "../../kit";
import type { DemoModule } from "../../types";

const COLS = 26;
const ROWS = 17;
const CELL = 0.46;
/** 上・右・下・左の順の隣の向き。 */
const DIRS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;

type Tileset = {
  names: string[];
  weights: number[];
  /** compat[t][d]：タイル t の d 方向の隣に置けるタイルのビット集合。 */
  compat: number[][];
  colors: string[];
  heights: number[];
  /** 道路のタイル：上・右・下・左の接続（1 なら道がつながる）。 */
  sockets?: number[][];
};

/** 地形：深い海 → 浅い海 → 砂浜 → 草原 → 森 → 丘 → 山。隣り合えるのは 1 段違いまで。 */
function terrainTiles(): Tileset {
  const names = ["深い海", "浅い海", "砂浜", "草原", "森", "丘", "山"];
  const compat = names.map((_, t) => {
    let mask = 0;
    for (let other = 0; other < names.length; other++) {
      if (Math.abs(other - t) <= 1) {
        mask |= 1 << other;
      }
    }
    return [mask, mask, mask, mask];
  });
  return {
    names,
    weights: [3.5, 2.5, 1, 2.2, 2.2, 1.8, 1.6],
    compat,
    colors: [
      "#1e4f8a",
      "#3b82c4",
      "#e3d29a",
      "#8cc265",
      "#3f8a44",
      "#9b8a64",
      "#d9dde3",
    ],
    heights: [0.04, 0.08, 0.14, 0.2, 0.34, 0.5, 0.85],
  };
}

/** 道路：4 辺それぞれ道がつながるか（16 通り）。隣と向かい合う辺の接続がそろうものだけ置ける。 */
function roadTiles(): Tileset {
  const sockets: number[][] = [];
  const names: string[] = [];
  const weights: number[] = [];
  for (let mask = 0; mask < 16; mask++) {
    const sides = [0, 1, 2, 3].map((d) => (mask >> d) & 1);
    const count = sides.reduce((sum, value) => sum + value, 0);
    sockets.push(sides);
    names.push(count === 0 ? "空き地" : `道（${count} 方向）`);
    // 空き地を多めに、行き止まり（1 方向）は少なめにする
    weights.push([9, 0.12, 1.4, 0.5, 0.2][count] ?? 1);
  }
  const compat = sockets.map((mine) =>
    DIRS.map((_, d) => {
      let mask = 0;
      for (const [other, theirs] of sockets.entries()) {
        if (mine[d] === theirs[(d + 2) % 4]) {
          mask |= 1 << other;
        }
      }
      return mask;
    })
  );
  return {
    names,
    weights,
    compat,
    colors: sockets.map(() => "#7fae5d"),
    heights: sockets.map(() => 0.08),
    sockets,
  };
}

const bitCount = (value: number) => {
  let n = value - ((value >> 1) & 0x55_55_55_55);
  n = (n & 0x33_33_33_33) + ((n >> 2) & 0x33_33_33_33);
  return (((n + (n >> 4)) & 0x0f_0f_0f_0f) * 0x01_01_01_01) >>> 24;
};

export const demo: DemoModule = {
  alt: "マス目の各マスに「置けるタイルの候補」を持たせ、候補が一番少ないマスから 1 つずつタイルを決めていく波動関数崩壊（WFC）のデモ。タイルを決めるたびに、隣のマスから「隣り合えないタイル」を取り除き、その影響を次々に伝えていく。地形では、海の隣に山が来ないよう 1 段違いの地形しか隣り合えないので、海・砂浜・草原・森・山が自然に並ぶ。道路では、辺の道がつながるタイルしか隣に置けないので、途切れない道路網ができる。灰色のマスはまだ決まっていないマスで、明るいほど候補が少ない。",
  camera: { position: [0, 9.6, 8.2], target: [0, 0, 0.4], fov: 42 },
  studio: { floor: false },
  controls: [
    {
      type: "select",
      key: "tileset",
      label: "タイルの種類",
      value: "terrain",
      options: [
        { value: "terrain", label: "地形（1 段違いまで隣り合える）" },
        { value: "roads", label: "道路（辺の接続をそろえる）" },
      ],
    },
    {
      type: "range",
      key: "speed",
      label: "1 秒に決めるマスの数",
      min: 5,
      max: 400,
      step: 5,
      value: 60,
    },
    {
      type: "toggle",
      key: "entropy",
      label: "候補の数を明るさで表示",
      value: true,
    },
    { type: "button", key: "restart", label: "やり直す（別の結果）" },
  ],
  legend: [
    {
      color: "#9c8fd0",
      label: "まだ決まっていないマス（明るいほど候補が少ない）",
    },
    { color: palette.coral, label: "いま決めたマス" },
  ],
  setup(context) {
    const { scene, params } = context;
    const count = COLS * ROWS;
    const tiles = new InstancedMesh(
      new BoxGeometry(CELL * 0.96, 1, CELL * 0.96),
      new MeshStandardMaterial({ roughness: 0.8 }),
      count
    );
    tiles.castShadow = true;
    tiles.receiveShadow = true;
    scene.add(tiles);
    // 道路の舗装（中心 + 4 方向の腕）
    const roads = new InstancedMesh(
      new BoxGeometry(1, 1, 1),
      new MeshStandardMaterial({ color: "#2d323b", roughness: 0.9 }),
      count * 5
    );
    scene.add(roads);
    const lines = new InstancedMesh(
      new BoxGeometry(1, 1, 1),
      new MeshStandardMaterial({
        color: "#f2d16b",
        emissive: "#f2d16b",
        emissiveIntensity: 0.2,
      }),
      count * 4
    );
    scene.add(lines);

    let tileset = terrainTiles();
    let domains = new Uint32Array(count);
    let seed = 1;
    let random = rng(seed);
    let collapsed = 0;
    let contradictions = 0;
    let lastCell = -1;
    let budget = 0;
    let tilesetUsed = "";
    let finishedTime = -1;

    const full = () => (1 << tileset.names.length) - 1;

    const propagate = (start: number) => {
      const stack = [start];
      while (stack.length > 0) {
        const cell = stack.pop() ?? 0;
        const x = cell % COLS;
        const y = Math.floor(cell / COLS);
        const domain = domains[cell] ?? 0;
        for (const [d, [dx, dy]] of DIRS.entries()) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) {
            continue;
          }
          // 今のマスの候補のどれかと隣り合えるタイルだけを、隣のマスに残す
          let allowed = 0;
          for (let t = 0; t < tileset.names.length; t++) {
            if ((domain >> t) & 1) {
              // 和集合（OR）を取る
              allowed ^= (tileset.compat[t]?.[d] ?? 0) & ~allowed;
            }
          }
          const neighbor = ny * COLS + nx;
          const before = domains[neighbor] ?? 0;
          const after = before & allowed;
          if (after !== before) {
            if (after === 0) {
              return false;
            }
            domains[neighbor] = after;
            stack.push(neighbor);
          }
        }
      }
      return true;
    };

    const reset = () => {
      domains = new Uint32Array(count).fill(full());
      collapsed = 0;
      lastCell = -1;
      finishedTime = -1;
      // 道路は外周の外へ伸びないように、外向きの辺に道があるタイルを最初から除く
      const { sockets } = tileset;
      if (sockets) {
        for (let cell = 0; cell < count; cell++) {
          const x = cell % COLS;
          const y = Math.floor(cell / COLS);
          let mask = domains[cell] ?? 0;
          for (const [t, sides] of sockets.entries()) {
            const outward =
              (y === 0 && sides[0] === 1) ||
              (x === COLS - 1 && sides[1] === 1) ||
              (y === ROWS - 1 && sides[2] === 1) ||
              (x === 0 && sides[3] === 1);
            if (outward) {
              mask &= ~(1 << t);
            }
          }
          domains[cell] = mask;
        }
        for (let cell = 0; cell < count; cell++) {
          propagate(cell);
        }
      }
    };

    /** 候補が最も少ないマスを 1 つ選び、重みに従ってタイルを 1 つに決める。 */
    const step = () => {
      let best = -1;
      let bestScore = Number.POSITIVE_INFINITY;
      for (let cell = 0; cell < count; cell++) {
        const n = bitCount(domains[cell] ?? 0);
        if (n > 1) {
          const score = n + random() * 0.5;
          if (score < bestScore) {
            bestScore = score;
            best = cell;
          }
        }
      }
      if (best < 0) {
        return false;
      }
      const domain = domains[best] ?? 0;
      // 重み：タイルごとの出やすさ × すでに決まった隣と同じタイルなら出やすく（まとまった地域になる）
      const bx = best % COLS;
      const by = Math.floor(best / COLS);
      const weightOf = (t: number) => {
        let weight = tileset.weights[t] ?? 1;
        if (!tileset.sockets) {
          for (const [dx, dy] of DIRS) {
            const nx = bx + dx;
            const ny = by + dy;
            if (
              nx >= 0 &&
              ny >= 0 &&
              nx < COLS &&
              ny < ROWS &&
              domains[ny * COLS + nx] === 1 << t
            ) {
              weight *= 1.8;
            }
          }
        }
        return weight;
      };
      let total = 0;
      for (let t = 0; t < tileset.names.length; t++) {
        if ((domain >> t) & 1) {
          total += weightOf(t);
        }
      }
      let pick = random() * total;
      let chosen = 0;
      for (let t = 0; t < tileset.names.length; t++) {
        if ((domain >> t) & 1) {
          pick -= weightOf(t);
          chosen = t;
          if (pick <= 0) {
            break;
          }
        }
      }
      domains[best] = 1 << chosen;
      lastCell = best;
      if (!propagate(best)) {
        // 矛盾（候補が 0 のマス）が出たら、最初からやり直す
        contradictions++;
        reset();
      }
      return true;
    };

    const matrix = new Matrix4();
    const quaternion = new Quaternion();
    const color = new Color();
    const undecided = new Color("#3a3552");
    const bright = new Color("#9c8fd0");
    const hidden = new Matrix4().makeScale(0, 0, 0);
    const draw = () => {
      collapsed = 0;
      const showEntropy = params["entropy"] === true;
      const maxBits = tileset.names.length;
      for (let cell = 0; cell < count; cell++) {
        const x = (cell % COLS) - COLS / 2 + 0.5;
        const z = Math.floor(cell / COLS) - ROWS / 2 + 0.5;
        const domain = domains[cell] ?? 0;
        const n = bitCount(domain);
        let height = 0.04;
        if (n === 1) {
          collapsed++;
          const t = Math.log2(domain);
          height = tileset.heights[t] ?? 0.1;
          color.set(tileset.colors[t] ?? "#888888");
          if (cell === lastCell) {
            color.lerp(new Color(palette.coral), 0.6);
          }
        } else {
          color.copy(undecided);
          if (showEntropy) {
            color.lerp(bright, 1 - (n - 1) / (maxBits - 1));
          }
        }
        matrix.compose(
          new Vector3(x * CELL, height / 2, z * CELL),
          quaternion,
          new Vector3(1, height, 1)
        );
        tiles.setMatrixAt(cell, matrix);
        tiles.setColorAt(cell, color);
        // 道路の舗装と中央線
        const sockets =
          n === 1 ? tileset.sockets?.[Math.log2(domain)] : undefined;
        const hasRoad = sockets?.some((value) => value === 1) ?? false;
        roads.setMatrixAt(
          cell * 5,
          hasRoad
            ? new Matrix4().compose(
                new Vector3(x * CELL, 0.1, z * CELL),
                quaternion,
                new Vector3(CELL * 0.42, 0.04, CELL * 0.42)
              )
            : hidden
        );
        for (const [d, [dx, dy]] of DIRS.entries()) {
          const on = sockets?.[d] === 1;
          const center = new Vector3(
            (x + dx * 0.27) * CELL,
            0.1,
            (z + dy * 0.27) * CELL
          );
          const size =
            dx === 0
              ? new Vector3(CELL * 0.42, 0.04, CELL * 0.3)
              : new Vector3(CELL * 0.3, 0.04, CELL * 0.42);
          roads.setMatrixAt(
            cell * 5 + 1 + d,
            on ? new Matrix4().compose(center, quaternion, size) : hidden
          );
          const lineSize =
            dx === 0
              ? new Vector3(CELL * 0.05, 0.05, CELL * 0.4)
              : new Vector3(CELL * 0.4, 0.05, CELL * 0.05);
          lines.setMatrixAt(
            cell * 4 + d,
            on
              ? new Matrix4().compose(
                  center
                    .clone()
                    .setY(0.11)
                    .add(new Vector3(dx * 0.03, 0, dy * 0.03)),
                  quaternion,
                  lineSize
                )
              : hidden
          );
        }
      }
      tiles.instanceMatrix.needsUpdate = true;
      if (tiles.instanceColor) {
        tiles.instanceColor.needsUpdate = true;
      }
      roads.instanceMatrix.needsUpdate = true;
      lines.instanceMatrix.needsUpdate = true;
    };

    return {
      action(key) {
        if (key === "restart") {
          seed++;
          random = rng(seed);
          reset();
        }
      },
      update({ time, dt }) {
        const kind = String(params["tileset"]);
        if (kind !== tilesetUsed) {
          tilesetUsed = kind;
          tileset = kind === "roads" ? roadTiles() : terrainTiles();
          reset();
        }
        budget += dt * Number(params["speed"]);
        let steps = 0;
        while (budget >= 1 && steps < 400) {
          budget -= 1;
          steps++;
          if (!step()) {
            budget = 0;
            break;
          }
        }
        draw();
        if (collapsed === count) {
          if (finishedTime < 0) {
            finishedTime = time;
          } else if (time - finishedTime > 3) {
            seed++;
            random = rng(seed);
            reset();
          }
        }
        context.readout("決まったマス", `${collapsed} / ${count}`);
        context.readout("矛盾してやり直した回数", `${contradictions}`);
        context.caption(
          kind === "roads"
            ? "各マスの 4 辺に「道がつながるか」の印があり、隣り合う辺の印がそろうタイルしか置けない。1 マス決めるたびに、隣のマスから合わないタイルを取り除き、その影響を次々に伝える（制約の伝播）。だから、どこまで行っても道が途切れない。"
            : "最初はどのマスもすべてのタイルが候補（灰色）。候補が一番少ないマスを選んで 1 つに決め、隣のマスから「隣り合えないタイル」を取り除く。海の隣に山が置けないというルールだけで、海岸線や山並みが自然にできる。"
        );
      },
    };
  },
};
