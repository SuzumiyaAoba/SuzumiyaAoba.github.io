import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Mesh,
  MeshStandardMaterial,
  SRGBColorSpace,
  Vector3,
} from "three";
import { palette, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";

const COLS = 24;
const ROWS = 15;
const TILE = 0.5;
const PX = 128;

/** タイル番号のビット：上 1、右 2、下 4、左 8。ビットが立った辺には川が通る。 */
const EDGE = { top: 1, right: 2, bottom: 4, left: 8 } as const;

/** 16 枚のタイルを 4×4 に並べた画像を描く。辺の中点どうしを川でつなぐので、同じ色の辺どうしは必ずつながる。 */
function drawAtlas(showEdges: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = PX * 4;
  canvas.height = PX * 4;
  const context = canvas.getContext("2d");
  if (!context) {
    return canvas;
  }
  const mid: Record<number, [number, number]> = {
    [EDGE.top]: [PX / 2, 0],
    [EDGE.right]: [PX, PX / 2],
    [EDGE.bottom]: [PX / 2, PX],
    [EDGE.left]: [0, PX / 2],
  };
  for (let tile = 0; tile < 16; tile++) {
    const ox = (tile % 4) * PX;
    const oy = Math.floor(tile / 4) * PX;
    context.save();
    context.translate(ox, oy);
    context.beginPath();
    context.rect(0, 0, PX, PX);
    context.clip();
    // 草地：タイルの内側だけに模様を置くので、どのタイルと並べても境目がそろう
    context.fillStyle = "#6fa04e";
    context.fillRect(0, 0, PX, PX);
    const random = rng(tile * 17 + 3);
    for (let n = 0; n < 26; n++) {
      const x = 10 + random() * (PX - 20);
      const y = 10 + random() * (PX - 20);
      context.fillStyle = random() < 0.5 ? "#80b25c" : "#5e8e42";
      context.beginPath();
      context.arc(x, y, 2 + random() * 4, 0, Math.PI * 2);
      context.fill();
    }
    // 川：川の通る辺の中点から、タイルの中心へ曲線で結ぶ
    const edges = [EDGE.top, EDGE.right, EDGE.bottom, EDGE.left].filter(
      (bit) => (tile & bit) !== 0
    );
    const drawRiver = (width: number, color: string) => {
      context.strokeStyle = color;
      context.lineWidth = width;
      context.lineCap = "round";
      if (edges.length === 2) {
        const [a, b] = edges;
        const [ax, ay] = mid[a ?? 1] ?? [0, 0];
        const [bx, by] = mid[b ?? 1] ?? [0, 0];
        context.beginPath();
        context.moveTo(ax, ay);
        context.quadraticCurveTo(PX / 2, PX / 2, bx, by);
        context.stroke();
      } else {
        for (const bit of edges) {
          const [x, y] = mid[bit] ?? [0, 0];
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(PX / 2, PX / 2);
          context.stroke();
        }
        if (edges.length === 1) {
          // 行き止まりは池にする
          context.fillStyle = color;
          context.beginPath();
          context.arc(PX / 2, PX / 2, width * 0.9, 0, Math.PI * 2);
          context.fill();
        }
      }
    };
    if (edges.length > 0) {
      drawRiver(46, "#d8c58f");
      drawRiver(30, "#3b7fc4");
      drawRiver(10, "#6fb2ec");
    }
    // 岩：川と重ならない角のあたりに
    if (random() < 0.6) {
      const corner = Math.floor(random() * 4);
      const cx = corner % 2 === 0 ? 26 : PX - 26;
      const cy = corner < 2 ? 26 : PX - 26;
      context.fillStyle = "#8e8a80";
      context.beginPath();
      context.ellipse(cx, cy, 11, 8, random(), 0, Math.PI * 2);
      context.fill();
    }
    if (showEdges) {
      // 辺の色（川あり＝赤、なし＝青）
      for (const [bit, [x, y, w, h]] of [
        [EDGE.top, [0, 0, PX, 8]],
        [EDGE.right, [PX - 8, 0, 8, PX]],
        [EDGE.bottom, [0, PX - 8, PX, 8]],
        [EDGE.left, [0, 0, 8, PX]],
      ] as const) {
        context.fillStyle = (tile & bit) === 0 ? palette.sky : palette.coral;
        context.fillRect(x, y, w, h);
      }
      context.fillStyle = "rgba(16,22,31,0.75)";
      context.fillRect(PX / 2 - 16, PX / 2 - 12, 32, 24);
      context.fillStyle = "#ffffff";
      context.font = "bold 18px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(tile), PX / 2, PX / 2);
    }
    context.restore();
  }
  return canvas;
}

export const demo: DemoModule = {
  alt: "4 辺それぞれに色（ここでは「川が通る／通らない」）を付けたタイルを、隣り合う辺の色がそろうように並べるワン・タイルのデモ。2 色の辺なら 16 枚のタイルで、どんな並べ方にも対応できる。左上から順に、左と上の辺に合うタイルの中からランダムに選んで置くだけで、同じ模様のくり返しが目立たない、つながった川の流れる草原ができる。1 枚のタイルをくり返すだけの場合と比べると、くり返しの目立ち方がまったく違う。",
  camera: { position: [0, 7.8, 5.6], target: [0, 0, 0.3], fov: 45 },
  studio: { floor: false },
  controls: [
    {
      type: "select",
      key: "mode",
      label: "並べ方",
      value: "wang",
      options: [
        { value: "wang", label: "ワン・タイル（辺をそろえてランダム）" },
        { value: "repeat", label: "1 枚をくり返す" },
        { value: "random", label: "辺をそろえずランダム" },
      ],
    },
    {
      type: "toggle",
      key: "edges",
      label: "辺の色とタイル番号を表示",
      value: false,
    },
    {
      type: "range",
      key: "river",
      label: "川が通る辺の割合",
      min: 0,
      max: 1,
      step: 0.05,
      value: 0.35,
    },
    { type: "button", key: "reseed", label: "並べ直す" },
  ],
  legend: [
    { color: palette.coral, label: "川が通る辺" },
    { color: palette.sky, label: "川が通らない辺" },
  ],
  setup(context) {
    const { scene, params } = context;
    const plain = new CanvasTexture(drawAtlas(false));
    const labelled = new CanvasTexture(drawAtlas(true));
    for (const texture of [plain, labelled]) {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 8;
    }
    const material = new MeshStandardMaterial({ map: plain, roughness: 0.9 });
    const geometry = new BufferGeometry();
    const positions = new Float32Array(COLS * ROWS * 6 * 3);
    const uvs = new Float32Array(COLS * ROWS * 6 * 2);
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
    const ground = new Mesh(geometry, material);
    ground.receiveShadow = true;
    scene.add(ground);
    const grid = segments([], "#10161f", { width: 1, opacity: 0.35 });
    scene.add(grid);

    let seed = 1;
    let signature = "";
    const tiles = new Uint8Array(COLS * ROWS);

    /** 左と上の辺に合うタイルの中から選ぶ（右と下の辺は自由に決める）。 */
    const arrange = () => {
      const random = rng(seed);
      const mode = String(params["mode"]);
      const chance = Number(params["river"]);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          let tile = 0;
          if (mode === "repeat") {
            tile = 0b0101; // 上下に川が通る 1 枚
          } else if (mode === "random") {
            tile = Math.floor(random() * 16);
          } else {
            const left =
              x > 0
                ? (tiles[y * COLS + x - 1] ?? 0)
                : random() < chance
                  ? EDGE.right
                  : 0;
            const top =
              y > 0
                ? (tiles[(y - 1) * COLS + x] ?? 0)
                : random() < chance
                  ? EDGE.bottom
                  : 0;
            if ((left & EDGE.right) !== 0) {
              tile += EDGE.left;
            }
            if ((top & EDGE.bottom) !== 0) {
              tile += EDGE.top;
            }
            // 外周では川を外へ出さない
            if (x < COLS - 1 && random() < chance) {
              tile += EDGE.right;
            }
            if (y < ROWS - 1 && random() < chance) {
              tile += EDGE.bottom;
            }
          }
          tiles[y * COLS + x] = tile;
        }
      }
      // 四角形を並べ、タイル番号に合わせて画像のどの区画を貼るか（UV）を決める
      let v = 0;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const tile = tiles[y * COLS + x] ?? 0;
          const x0 = (x - COLS / 2) * TILE;
          const z0 = (y - ROWS / 2) * TILE;
          const u0 = (tile % 4) / 4;
          const v0 = 1 - (Math.floor(tile / 4) + 1) / 4;
          const eps = 0.5 / (PX * 4);
          const corners = [
            [x0, z0, u0 + eps, v0 + 0.25 - eps],
            [x0, z0 + TILE, u0 + eps, v0 + eps],
            [x0 + TILE, z0 + TILE, u0 + 0.25 - eps, v0 + eps],
            [x0 + TILE, z0, u0 + 0.25 - eps, v0 + 0.25 - eps],
          ] as const;
          for (const k of [0, 1, 2, 0, 2, 3]) {
            const [px, pz, u, vv] = corners[k] ?? corners[0];
            positions.set([px, 0, pz], v * 3);
            uvs.set([u, vv], v * 2);
            v++;
          }
        }
      }
      geometry.getAttribute("position").needsUpdate = true;
      geometry.getAttribute("uv").needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      const lines: Vector3[] = [];
      for (let x = 0; x <= COLS; x++) {
        lines.push(
          new Vector3((x - COLS / 2) * TILE, 0.005, (-ROWS / 2) * TILE),
          new Vector3((x - COLS / 2) * TILE, 0.005, (ROWS / 2) * TILE)
        );
      }
      for (let y = 0; y <= ROWS; y++) {
        lines.push(
          new Vector3((-COLS / 2) * TILE, 0.005, (y - ROWS / 2) * TILE),
          new Vector3((COLS / 2) * TILE, 0.005, (y - ROWS / 2) * TILE)
        );
      }
      grid.setPoints(lines);
      const used = new Set(tiles).size;
      let broken = 0;
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const tile = tiles[y * COLS + x] ?? 0;
          const right = x < COLS - 1 ? (tiles[y * COLS + x + 1] ?? 0) : null;
          const below = y < ROWS - 1 ? (tiles[(y + 1) * COLS + x] ?? 0) : null;
          if (
            right !== null &&
            ((tile & EDGE.right) !== 0) !== ((right & EDGE.left) !== 0)
          ) {
            broken++;
          }
          if (
            below !== null &&
            ((tile & EDGE.bottom) !== 0) !== ((below & EDGE.top) !== 0)
          ) {
            broken++;
          }
        }
      }
      context.readout("使ったタイルの種類", `${used} / 16`);
      context.readout("川が途切れた境目", `${broken}`);
    };

    return {
      action(key) {
        if (key === "reseed") {
          seed++;
          signature = "";
        }
      },
      update() {
        const key = [params["mode"], params["river"], seed].join("|");
        if (key !== signature) {
          signature = key;
          arrange();
        }
        material.map = params["edges"] === true ? labelled : plain;
        grid.visible = params["edges"] === true;
        const mode = String(params["mode"]);
        context.caption(
          mode === "repeat"
            ? "1 枚のタイルをくり返すと、同じ川が等間隔に並び、くり返しがすぐ目につく。広い地面にテクスチャを貼るときの典型的な問題。"
            : mode === "random"
              ? "辺の色をそろえずにランダムに並べると、境目で川が途切れたり、急に始まったりする（数値の「川が途切れた境目」）。"
              : "左と上の辺の色は、すでに置いたタイルで決まっている。残りの右と下の辺の色だけをランダムに決めて、その組み合わせのタイルを置く。16 枚しかないのに、川が途切れず、同じ並びもほとんど現れない。"
        );
      },
      dispose() {
        plain.dispose();
        labelled.dispose();
      },
    };
  },
};
