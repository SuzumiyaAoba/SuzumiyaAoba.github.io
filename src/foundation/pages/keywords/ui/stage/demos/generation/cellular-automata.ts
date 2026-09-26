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

const COLS = 72;
const ROWS = 44;
const CELL = 0.17;

export const demo: DemoModule = {
  alt: "マス目の各マスを「壁」か「床」にし、周りの 8 マスのうち壁がいくつあるかで次の状態を決める、というルールを全マスに同時に当てはめるセルオートマトンのデモ。最初はでたらめに壁をばらまいた雑音のようなマス目が、数回くり返すだけで、なめらかな壁に囲まれた洞窟になる。最後に、つながった床の領域を塗り分けて、一番大きな洞窟だけを残す。ライフゲームに切り替えると、同じ仕組みで生き物のように動く模様が生まれる。",
  camera: { position: [0, 8.5, 7.8], target: [0, 0, 0.4], fov: 42 },
  studio: { floor: false },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "ルール",
      value: "cave",
      options: [
        { value: "cave", label: "洞窟（4-5 ルール）" },
        { value: "life", label: "ライフゲーム（B3/S23）" },
      ],
    },
    {
      type: "range",
      key: "fill",
      label: "最初に壁にする割合",
      min: 0.3,
      max: 0.6,
      step: 0.01,
      value: 0.46,
    },
    {
      type: "range",
      key: "birth",
      label: "床が壁になる壁の数（以上）",
      min: 3,
      max: 8,
      step: 1,
      value: 5,
    },
    {
      type: "range",
      key: "survive",
      label: "壁が壁のまま残る壁の数（以上）",
      min: 2,
      max: 8,
      step: 1,
      value: 4,
    },
    {
      type: "range",
      key: "steps",
      label: "くり返す回数（洞窟）",
      min: 0,
      max: 12,
      step: 1,
      value: 5,
    },
    {
      type: "toggle",
      key: "regions",
      label: "つながった領域を塗り分ける",
      value: true,
    },
    {
      type: "toggle",
      key: "fillSmall",
      label: "小さな空洞を埋める",
      value: false,
    },
    { type: "button", key: "reseed", label: "ばらまき直す" },
  ],
  legend: [
    { color: "#7c7466", label: "壁" },
    { color: "#d6b98a", label: "一番大きな洞窟（床）" },
    { color: palette.coral, label: "ほかから行けない小さな空洞" },
  ],
  setup(context) {
    const { scene, params } = context;
    const count = COLS * ROWS;
    const cells = new InstancedMesh(
      new BoxGeometry(CELL, 1, CELL),
      new MeshStandardMaterial({ roughness: 0.9 }),
      count
    );
    cells.castShadow = true;
    cells.receiveShadow = true;
    scene.add(cells);

    let grid = new Uint8Array(count);
    let seed = 2;
    let step = 0;
    let hold = 0;
    let clock = 0;
    let signature = "";
    let regionOf = new Int32Array(count);
    let largest = -1;
    let regionCount = 0;

    const at = (x: number, y: number) =>
      x < 0 || y < 0 || x >= COLS || y >= ROWS ? 1 : (grid[y * COLS + x] ?? 1);
    const seedGrid = () => {
      const random = rng(seed);
      const fill = Number(params["fill"]);
      const life = params["mode"] === "life";
      grid = new Uint8Array(count);
      for (let index = 0; index < count; index++) {
        grid[index] = random() < (life ? 0.3 : fill) ? 1 : 0;
      }
      step = 0;
      clock = 0;
    };

    /** 全マスを同時に更新する（新しいマス目に書いてから入れ替える）。 */
    const advance = () => {
      const next = new Uint8Array(count);
      const life = params["mode"] === "life";
      const birth = Number(params["birth"]);
      const survive = Number(params["survive"]);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          let n = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx !== 0 || dy !== 0) {
                // ライフゲームは外側を「死」、洞窟は外側を「壁」とみなす
                n += life
                  ? x + dx < 0 || y + dy < 0 || x + dx >= COLS || y + dy >= ROWS
                    ? 0
                    : (grid[(y + dy) * COLS + x + dx] ?? 0)
                  : at(x + dx, y + dy);
              }
            }
          }
          const alive = grid[y * COLS + x] === 1;
          if (life) {
            next[y * COLS + x] = n === 3 || (alive && n === 2) ? 1 : 0;
          } else {
            next[y * COLS + x] = alive
              ? n >= survive
                ? 1
                : 0
              : n >= birth
                ? 1
                : 0;
          }
        }
      }
      grid = next;
      step++;
    };

    /** 床のつながった領域に番号を付ける（塗りつぶし）。 */
    const labelRegions = () => {
      regionOf = new Int32Array(count).fill(-1);
      const sizes: number[] = [];
      for (let start = 0; start < count; start++) {
        if (grid[start] !== 0 || (regionOf[start] ?? -1) >= 0) {
          continue;
        }
        const id = sizes.length;
        let size = 0;
        const stack = [start];
        regionOf[start] = id;
        while (stack.length > 0) {
          const cell = stack.pop() ?? 0;
          size++;
          const x = cell % COLS;
          const y = Math.floor(cell / COLS);
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ] as const) {
            const nx = x + dx;
            const ny = y + dy;
            const neighbor = ny * COLS + nx;
            if (
              nx >= 0 &&
              ny >= 0 &&
              nx < COLS &&
              ny < ROWS &&
              grid[neighbor] === 0 &&
              (regionOf[neighbor] ?? -1) < 0
            ) {
              regionOf[neighbor] = id;
              stack.push(neighbor);
            }
          }
        }
        sizes.push(size);
      }
      regionCount = sizes.length;
      largest = sizes.indexOf(Math.max(...sizes, 0));
    };

    const matrix = new Matrix4();
    const quaternion = new Quaternion();
    const color = new Color();
    const wall = new Color("#7c7466");
    const floor = new Color("#d6b98a");
    const small = new Color(palette.coral);
    const alive = new Color(palette.lime);
    const dead = new Color("#1d2635");
    const draw = () => {
      const life = params["mode"] === "life";
      const showRegions = params["regions"] === true && !life;
      const fillSmall = params["fillSmall"] === true && !life;
      let walls = 0;
      for (let index = 0; index < count; index++) {
        const x = (index % COLS) - COLS / 2 + 0.5;
        const z = Math.floor(index / COLS) - ROWS / 2 + 0.5;
        let isWall = grid[index] === 1;
        const region = regionOf[index] ?? -1;
        if (!isWall && fillSmall && region !== largest && region >= 0) {
          isWall = true;
        }
        let height = 0.05;
        if (life) {
          height = isWall ? 0.25 : 0.02;
          color.copy(isWall ? alive : dead);
        } else if (isWall) {
          walls++;
          height = 0.55;
          color.copy(wall).multiplyScalar(0.85 + ((index * 7919) % 13) / 60);
        } else {
          color.copy(showRegions && region !== largest ? small : floor);
        }
        matrix.compose(
          new Vector3(x * CELL, height / 2, z * CELL),
          quaternion,
          new Vector3(1, height, 1)
        );
        cells.setMatrixAt(index, matrix);
        cells.setColorAt(index, color);
      }
      cells.instanceMatrix.needsUpdate = true;
      if (cells.instanceColor) {
        cells.instanceColor.needsUpdate = true;
      }
      return walls;
    };

    return {
      action(key) {
        if (key === "reseed") {
          seed++;
          signature = "";
        }
      },
      update({ dt }) {
        const mode = String(params["mode"]);
        const key = [
          mode,
          params["fill"],
          params["birth"],
          params["survive"],
          seed,
        ].join("|");
        if (key !== signature) {
          signature = key;
          seedGrid();
        }
        clock += dt;
        const life = mode === "life";
        const target = Number(params["steps"]);
        if (life && clock > 0.12) {
          clock = 0;
          advance();
        } else if (!life && clock > 0.55) {
          clock = 0;
          if (step < target) {
            advance();
          } else if (step > target) {
            seedGrid();
          } else {
            // 最後まで来たら、しばらく見せてから別の乱数でばらまき直す
            hold += 0.55;
            if (hold > 4) {
              hold = 0;
              seed++;
              signature = "";
            }
          }
        }
        labelRegions();
        const walls = draw();
        if (life) {
          context.readout("世代", `${step}`);
          context.readout(
            "生きているマス",
            `${grid.reduce((sum, value) => sum + value, 0)}`
          );
          context.caption(
            "生きているマスは、周りに 2 つか 3 つ生きていれば生き残り、死んだマスは周りにちょうど 3 つ生きていれば生まれる。これだけのルールで、動き回る形（グライダー）や点滅する形が自然に現れる。"
          );
        } else {
          context.readout("くり返し", `${step} / ${target}`);
          context.readout("壁の割合", `${Math.round((walls / count) * 100)}%`);
          context.readout("床の領域の数", `${regionCount}`);
          context.caption(
            step === 0
              ? "最初は、でたらめに壁（灰色）をばらまいただけの雑音のようなマス目。ここから、周りの 8 マスの壁の数で次の状態を決めるルールを、全部のマスに同時に当てはめていく。"
              : "壁に囲まれた床は壁になり、床に囲まれた壁は床になるので、くり返すたびに小さな点が消えて、なめらかな洞窟の壁ができる。つながった床を塗り分けると、ほかから行けない小さな空洞（赤）が見つかるので、埋めるか通路でつなぐ。"
          );
        }
      },
    };
  },
};
