import {
  BoxGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import { palette, rng, segments } from "../../kit";
import type { DemoModule } from "../../types";

const COLS = 40;
const ROWS = 26;
const CELL = 0.3;

type Rect = { x: number; y: number; w: number; h: number };
type Node = {
  rect: Rect;
  depth: number;
  children: [number, number] | null;
  room: Rect | null;
  parent: number;
  vertical: boolean;
};

const DEPTH_COLORS = [
  palette.coral,
  palette.amber,
  palette.lime,
  palette.cyan,
  palette.sky,
  palette.violet,
  palette.pink,
];

export const demo: DemoModule = {
  alt: "ダンジョンの範囲を、縦か横に 2 つに分けることをくり返して小さな区画に分け（二分空間分割）、各区画の中に部屋を 1 つずつ置き、分けたときの兄弟どうしを通路でつなぐデモ。分け方を木（二分木）として覚えておくので、兄弟の区画をたどるだけで、すべての部屋が必ずつながる。部屋どうしが重ならないことも、区画が重ならないことから保証される。色つきの線は分けた位置で、色は分けた深さ。右下の図が分割の木。",
  camera: { position: [0, 10.5, 7.6], target: [0, 0, 0.5], fov: 42 },
  studio: { floor: false },
  controls: [
    {
      type: "range",
      key: "minSize",
      label: "区画の最小の大きさ（マス）",
      min: 4,
      max: 14,
      step: 1,
      value: 7,
    },
    {
      type: "range",
      key: "depth",
      label: "分ける深さの上限",
      min: 1,
      max: 7,
      step: 1,
      value: 5,
    },
    {
      type: "range",
      key: "ratio",
      label: "分ける位置のばらつき",
      min: 0,
      max: 0.4,
      step: 0.02,
      value: 0.2,
    },
    {
      type: "range",
      key: "roomFill",
      label: "区画に対する部屋の大きさ",
      min: 0.4,
      max: 1,
      step: 0.05,
      value: 0.75,
    },
    {
      type: "range",
      key: "speed",
      label: "組み立ての速さ",
      min: 0.5,
      max: 10,
      step: 0.5,
      value: 3,
    },
    { type: "button", key: "reseed", label: "作り直す" },
  ],
  legend: [
    { color: palette.coral, label: "分けた位置（色は深さ）" },
    { color: "#d9c7a4", label: "部屋" },
    { color: "#9d8a6c", label: "通路" },
  ],
  setup(context) {
    const { scene, params } = context;
    const count = COLS * ROWS;
    const tiles = new InstancedMesh(
      new BoxGeometry(CELL, 1, CELL),
      new MeshStandardMaterial({ roughness: 0.85 }),
      count
    );
    tiles.receiveShadow = true;
    tiles.castShadow = true;
    scene.add(tiles);
    const splitLines = DEPTH_COLORS.map((color) => {
      const line = segments([], color, { width: 3 });
      scene.add(line);
      return line;
    });

    // 分割の木（右下の図）
    const canvas = document.createElement("canvas");
    canvas.width = 440;
    canvas.height = 200;
    canvas.style.width = "220px";
    canvas.style.height = "100px";
    const figure = document.createElement("figure");
    figure.className = "keyword-stage-graph";
    const caption = document.createElement("figcaption");
    caption.textContent = "分割の木（葉が部屋）";
    figure.append(caption, canvas);
    context.hud(figure);

    let nodes: Node[] = [];
    let order: number[] = [];
    let corridors: [number, number][][] = [];
    let seed = 4;
    let signature = "";
    let progress = 0;

    const toWorld = (x: number, y: number) =>
      new Vector3((x - COLS / 2) * CELL, 0, (y - ROWS / 2) * CELL);

    const build = () => {
      const random = rng(seed);
      const minSize = Number(params["minSize"]);
      const maxDepth = Number(params["depth"]);
      const spread = Number(params["ratio"]);
      nodes = [
        {
          rect: { x: 1, y: 1, w: COLS - 2, h: ROWS - 2 },
          depth: 0,
          children: null,
          room: null,
          parent: -1,
          vertical: false,
        },
      ];
      order = [];
      // 幅優先で分ける（上の段から順に分かれていく様子を見せる）
      const queue = [0];
      while (queue.length > 0) {
        const index = queue.shift() ?? 0;
        const node = nodes[index];
        if (!node || node.depth >= maxDepth) {
          continue;
        }
        const { rect } = node;
        // 長い方の辺を分ける。短すぎて 2 つに分けられないなら葉にする
        const vertical =
          rect.w > rect.h ? true : rect.w < rect.h ? false : random() < 0.5;
        const length = vertical ? rect.w : rect.h;
        if (length < minSize * 2) {
          continue;
        }
        const t = 0.5 + (random() * 2 - 1) * spread;
        const cut = Math.max(
          minSize,
          Math.min(length - minSize, Math.round(length * t))
        );
        const first: Rect = vertical
          ? { x: rect.x, y: rect.y, w: cut, h: rect.h }
          : { x: rect.x, y: rect.y, w: rect.w, h: cut };
        const second: Rect = vertical
          ? { x: rect.x + cut, y: rect.y, w: rect.w - cut, h: rect.h }
          : { x: rect.x, y: rect.y + cut, w: rect.w, h: rect.h - cut };
        const a =
          nodes.push({
            rect: first,
            depth: node.depth + 1,
            children: null,
            room: null,
            parent: index,
            vertical: false,
          }) - 1;
        const b =
          nodes.push({
            rect: second,
            depth: node.depth + 1,
            children: null,
            room: null,
            parent: index,
            vertical: false,
          }) - 1;
        node.children = [a, b];
        node.vertical = vertical;
        order.push(index);
        queue.push(a, b);
      }
      // 葉の区画に部屋を置く（区画の中に、少し余白を取って）
      const fill = Number(params["roomFill"]);
      for (const node of nodes) {
        if (node.children) {
          continue;
        }
        const w = Math.max(
          2,
          Math.round((node.rect.w - 2) * (fill + random() * (1 - fill)))
        );
        const h = Math.max(
          2,
          Math.round((node.rect.h - 2) * (fill + random() * (1 - fill)))
        );
        const x =
          node.rect.x +
          1 +
          Math.floor(random() * Math.max(1, node.rect.w - 1 - w));
        const y =
          node.rect.y +
          1 +
          Math.floor(random() * Math.max(1, node.rect.h - 1 - h));
        node.room = {
          x,
          y,
          w: Math.min(w, node.rect.w - 2),
          h: Math.min(h, node.rect.h - 2),
        };
      }
      // 通路：分けた節ごとに、左の子孫の部屋と右の子孫の部屋を L 字でつなぐ（深い節から順に）
      const roomCenter = (index: number): [number, number] => {
        const node = nodes[index];
        if (!node) {
          return [0, 0];
        }
        if (node.room) {
          return [
            Math.floor(node.room.x + node.room.w / 2),
            Math.floor(node.room.y + node.room.h / 2),
          ];
        }
        const [a] = node.children ?? [index];
        return roomCenter(random() < 0.5 ? (node.children?.[1] ?? a) : a);
      };
      corridors = order.toReversed().map((index) => {
        const node = nodes[index];
        const [a, b] = node?.children ?? [0, 0];
        const [ax, ay] = roomCenter(a);
        const [bx, by] = roomCenter(b);
        const path: [number, number][] = [];
        const corner = random() < 0.5 ? [bx, ay] : [ax, by];
        const walk = (
          fromX: number,
          fromY: number,
          toX: number,
          toY: number
        ) => {
          const steps = Math.abs(toX - fromX) + Math.abs(toY - fromY);
          for (let s = 0; s <= steps; s++) {
            const x =
              fromX +
              Math.sign(toX - fromX) * Math.min(s, Math.abs(toX - fromX));
            const y =
              fromY +
              Math.sign(toY - fromY) * Math.max(0, s - Math.abs(toX - fromX));
            path.push([x, y]);
          }
        };
        walk(ax, ay, corner[0] ?? ax, corner[1] ?? ay);
        walk(corner[0] ?? ax, corner[1] ?? ay, bx, by);
        return path;
      });
      progress = 0;
    };

    const matrix = new Matrix4();
    const quaternion = new Quaternion();
    const color = new Color();
    const rock = new Color("#3a4150");
    const roomColor = new Color("#d9c7a4");
    const corridorColor = new Color("#9d8a6c");
    const draw = () => {
      // 段階：分割 → 部屋 → 通路
      const splits = Math.min(order.length, Math.floor(progress));
      const roomsShown = progress > order.length;
      const corridorsShown = Math.max(
        0,
        Math.min(corridors.length, Math.floor(progress - order.length - 1))
      );
      const kind = new Uint8Array(count);
      if (roomsShown) {
        for (const node of nodes) {
          const { room } = node;
          if (room) {
            for (let { y } = room; y < room.y + room.h; y++) {
              for (let { x } = room; x < room.x + room.w; x++) {
                kind[y * COLS + x] = 1;
              }
            }
          }
        }
      }
      for (let n = 0; n < corridorsShown; n++) {
        for (const [x, y] of corridors[n] ?? []) {
          const index = y * COLS + x;
          if (kind[index] === 0) {
            kind[index] = 2;
          }
        }
      }
      for (let index = 0; index < count; index++) {
        const x = index % COLS;
        const y = Math.floor(index / COLS);
        const k = kind[index] ?? 0;
        const height = k === 0 ? 0.42 : 0.06;
        color.copy(k === 1 ? roomColor : k === 2 ? corridorColor : rock);
        matrix.compose(
          toWorld(x + 0.5, y + 0.5).setY(height / 2),
          quaternion,
          new Vector3(1, height, 1)
        );
        tiles.setMatrixAt(index, matrix);
        tiles.setColorAt(index, color);
      }
      tiles.instanceMatrix.needsUpdate = true;
      if (tiles.instanceColor) {
        tiles.instanceColor.needsUpdate = true;
      }
      // 分けた位置の線
      const buckets: Vector3[][] = DEPTH_COLORS.map(() => []);
      for (let n = 0; n < splits; n++) {
        const node = nodes[order[n] ?? 0];
        const child = nodes[node?.children?.[0] ?? 0];
        if (!node || !child) {
          continue;
        }
        const { rect } = node;
        const from = node.vertical
          ? toWorld(child.rect.x + child.rect.w, rect.y)
          : toWorld(rect.x, child.rect.y + child.rect.h);
        const to = node.vertical
          ? toWorld(child.rect.x + child.rect.w, rect.y + rect.h)
          : toWorld(rect.x + rect.w, child.rect.y + child.rect.h);
        buckets[Math.min(DEPTH_COLORS.length - 1, node.depth)]?.push(
          from.setY(0.5),
          to.setY(0.5)
        );
      }
      for (const [index, line] of splitLines.entries()) {
        line.setPoints(buckets[index] ?? []);
        line.visible = (buckets[index]?.length ?? 0) > 0;
      }
      // 分割の木
      const context2d = canvas.getContext("2d");
      if (context2d) {
        context2d.clearRect(0, 0, canvas.width, canvas.height);
        const maxDepth = Math.max(...nodes.map((node) => node.depth), 1);
        const leafIndex = new Map<number, number>();
        let leaves = 0;
        const place = (index: number): number => {
          const node = nodes[index];
          if (!node?.children || !order.slice(0, splits).includes(index)) {
            leafIndex.set(index, leaves);
            leaves++;
            return leaves - 1;
          }
          const a = place(node.children[0]);
          const b = place(node.children[1]);
          const middle = (a + b) / 2;
          leafIndex.set(index, middle);
          return middle;
        };
        place(0);
        const xOf = (index: number) =>
          16 +
          ((leafIndex.get(index) ?? 0) / Math.max(1, leaves - 1)) *
            (canvas.width - 32);
        const yOf = (depth: number) =>
          20 + (depth / maxDepth) * (canvas.height - 40);
        context2d.lineWidth = 3;
        for (let n = 0; n < splits; n++) {
          const index = order[n] ?? 0;
          const node = nodes[index];
          for (const child of node?.children ?? []) {
            context2d.strokeStyle =
              DEPTH_COLORS[
                Math.min(DEPTH_COLORS.length - 1, node?.depth ?? 0)
              ] ?? "#ffffff";
            context2d.beginPath();
            context2d.moveTo(xOf(index), yOf(node?.depth ?? 0));
            context2d.lineTo(xOf(child), yOf((node?.depth ?? 0) + 1));
            context2d.stroke();
          }
        }
        for (const [index] of leafIndex) {
          const node = nodes[index];
          context2d.fillStyle =
            node?.room && roomsShown ? "#d9c7a4" : "#8494aa";
          context2d.beginPath();
          context2d.arc(xOf(index), yOf(node?.depth ?? 0), 6, 0, Math.PI * 2);
          context2d.fill();
        }
      }
      return { splits, corridorsShown };
    };

    return {
      action(key) {
        if (key === "reseed") {
          seed++;
          signature = "";
        }
      },
      update({ dt }) {
        const key = [
          params["minSize"],
          params["depth"],
          params["ratio"],
          params["roomFill"],
          seed,
        ].join("|");
        if (key !== signature) {
          signature = key;
          build();
        }
        progress += dt * Number(params["speed"]);
        const total = order.length + 1 + corridors.length;
        if (progress > total + 4 * Number(params["speed"])) {
          seed++;
          signature = "";
        }
        const { splits, corridorsShown } = draw();
        const leaves = nodes.filter((node) => !node.children).length;
        context.readout("分けた回数", `${splits} / ${order.length}`);
        context.readout("部屋（木の葉）", `${leaves}`);
        context.readout("通路", `${corridorsShown} / ${corridors.length}`);
        context.caption(
          progress <= order.length
            ? "範囲の長い方の辺を、真ん中あたりで 2 つに分ける。分けた 2 つをまた分ける…をくり返し、区画が最小の大きさを下回ったら止める。分け方は木として覚えておく。"
            : progress <= order.length + 1
              ? "木の葉（それ以上分けなかった区画）に、部屋を 1 つずつ置く。区画どうしが重ならないので、部屋も決して重ならない。"
              : "分けたときの兄弟の区画どうしを通路でつなぐ（深い所から順に）。木の根までたどれば、すべての部屋が 1 つにつながることが保証される。"
        );
      },
    };
  },
};
