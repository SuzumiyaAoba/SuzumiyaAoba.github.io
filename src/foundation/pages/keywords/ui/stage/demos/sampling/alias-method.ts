import { BoxGeometry, Mesh, Vector3 } from "three";
import type { MeshStandardMaterial } from "three";
import { marker, palette, rng, segments, standard } from "../../kit";
import type { DemoModule } from "../../types";
import { hudGraph } from "../../widgets";

const UNIT = 1.6;
const GAP = 1.35;
const WIDTH = 1.05;
const STEP_SECONDS = 1.3;

const ITEMS = [
  { name: "コモン", color: "#9aa7b8" },
  { name: "アンコモン", color: palette.lime },
  { name: "レア", color: palette.sky },
  { name: "エピック", color: palette.violet },
  { name: "レジェンド", color: palette.amber },
] as const;
const N = ITEMS.length;

const PRESETS: Record<string, readonly number[]> = {
  loot: [40, 25, 18, 12, 5],
  skewed: [55, 20, 12, 8, 5],
  even: [20, 20, 20, 20, 20],
};

type Piece = {
  id: number;
  item: number;
  column: number;
  bottom: number;
  height: number;
};
type Step = { pieces: Piece[]; note: string; from?: Map<number, Piece> };

/** ボーズの方法で表を作り、途中の状態を順に記録する。 */
function build(weights: readonly number[]) {
  const total = weights.reduce((sum, w) => sum + w, 0);
  const scaled = weights.map((w) => (w / total) * N);
  const prob = new Float64Array(N).fill(1);
  const alias = Int32Array.from({ length: N }, (_, i) => i);
  let nextId = N;
  const pieces: Piece[] = scaled.map((height, i) => ({
    id: i,
    item: i,
    column: i,
    bottom: 0,
    height,
  }));
  const steps: Step[] = [
    {
      pieces: pieces.map((piece) => ({ ...piece })),
      note: "重みを「平均が 1」になるように N 倍した棒。1 より低い列（小）と高い列（大）に分ける。",
    },
  ];
  const small: number[] = [];
  const large: number[] = [];
  for (const [i, value] of scaled.entries()) {
    (value < 1 ? small : large).push(i);
  }
  while (small.length > 0 && large.length > 0) {
    const s = small.pop() ?? 0;
    const l = large.pop() ?? 0;
    const hs = scaled[s] ?? 0;
    const hl = scaled[l] ?? 0;
    const moved = 1 - hs;
    prob[s] = hs;
    alias[s] = l;
    scaled[l] = hl - moved;
    const own = pieces.find((piece) => piece.column === l && piece.item === l);
    if (own) {
      own.height -= moved;
    }
    const piece: Piece = {
      id: nextId++,
      item: l,
      column: s,
      bottom: hs,
      height: moved,
    };
    pieces.push(piece);
    // 動く前の位置：大きい列のてっぺん
    const from = new Map([
      [piece.id, { ...piece, column: l, bottom: hl - moved }],
    ]);
    steps.push({
      pieces: pieces.map((p) => ({ ...p })),
      from,
      note: `小さい「${ITEMS[s]?.name}」の列の空き（${moved.toFixed(2)}）を、大きい「${ITEMS[l]?.name}」の列から切り取って埋める。これで「${ITEMS[s]?.name}」の列は高さ 1 ちょうどで確定。`,
    });
    ((scaled[l] ?? 0) < 1 ? small : large).push(l);
  }
  steps.push({
    pieces: pieces.map((p) => ({ ...p })),
    note: "どの列も高さ 1 で、色は多くても 2 つ。これで表の完成。",
  });
  const probability = scaled.map((_, i) => (weights[i] ?? 0) / total);
  return { steps, prob, alias, probability };
}

export const demo: DemoModule = {
  alt: "ガチャやドロップ品の重み付き抽選を、エイリアス法で高速に行うデモ。重みの棒を、平均が 1 になるように伸ばし、1 より高い列から切り取った部分を、1 より低い列の上に継ぎ足して、すべての列を高さ 1 にそろえる。どの列も多くて 2 色になる。抽選では、列をサイコロで 1 つ選び、0〜1 の乱数で下の色か上の色かを決めるだけなので、品物の数によらず 1 回の抽選が一定の時間で終わる。出た回数の割合が、元の重みに近づいていくことをグラフで確かめられる。",
  camera: {
    position: [0, 2.2, 10.5],
    target: [0, 1.6, 0],
    fov: 42,
    orbit: true,
  },
  controls: [
    {
      type: "select",
      key: "preset",
      label: "ドロップの重み",
      value: "loot",
      options: [
        { value: "loot", label: "40・25・18・12・5" },
        { value: "skewed", label: "55・20・12・8・5" },
        { value: "even", label: "すべて同じ" },
      ],
    },
    {
      type: "range",
      key: "rate",
      label: "1 秒の抽選回数",
      min: 1,
      max: 60,
      step: 1,
      value: 4,
    },
    { type: "button", key: "rebuild", label: "表を作り直す（手順を見る）" },
  ],
  legend: ITEMS.map(({ color, name }) => ({ color, label: name })),
  setup(context) {
    const { scene, params } = context;
    const columnX = (column: number) => (column - (N - 1) / 2) * GAP;
    const geometry = context.track(new BoxGeometry(1, 1, 1));
    const materials: MeshStandardMaterial[] = ITEMS.map(({ color }) =>
      context.track(standard(color, { roughness: 0.5, emissive: 0.08 }))
    );
    const meshes = new Map<number, Mesh>();
    const meshFor = (piece: Piece) => {
      let mesh = meshes.get(piece.id);
      if (!mesh) {
        mesh = new Mesh(geometry, materials[piece.item]);
        mesh.castShadow = true;
        scene.add(mesh);
        meshes.set(piece.id, mesh);
      }
      return mesh;
    };
    const average = segments(
      [
        new Vector3(columnX(0) - 0.8, UNIT, 0.4),
        new Vector3(columnX(N - 1) + 0.8, UNIT, 0.4),
      ],
      palette.ink,
      { width: 1.5, dashed: true, opacity: 0.7 }
    );
    scene.add(average);
    const averageLabel = context.label("高さ 1（平均）", { tone: "muted" });
    averageLabel.position.set(columnX(N - 1) + 1.5, UNIT, 0.4);
    scene.add(averageLabel);
    for (const [i, item] of ITEMS.entries()) {
      const label = context.label(item.name, { color: item.color });
      label.position.set(columnX(i), -0.35, 0.4);
      scene.add(label);
    }
    const pick = marker(palette.ink, 0.1);
    const frame = segments([], palette.ink, { width: 2 });
    scene.add(pick, frame);
    const result = context.label("", { tone: "strong", size: "md" });
    scene.add(result);
    const graph = hudGraph(context, {
      title: "出た割合（点線が元の重み）",
      min: 0,
      max: 0.6,
      xLabel: "コモン → レジェンド",
      samples: N * 20,
    });

    const random = rng(12);
    let table = build(PRESETS["loot"] ?? []);
    let preset = "loot";
    let stepIndex = 0;
    let stepTime = 0;
    let drawBudget = 0;
    let flash = 0;
    const tally = new Float64Array(N);
    let draws = 0;

    const restart = () => {
      table = build(PRESETS[preset] ?? []);
      stepIndex = 0;
      stepTime = 0;
      tally.fill(0);
      draws = 0;
      for (const mesh of meshes.values()) {
        scene.remove(mesh);
      }
      meshes.clear();
    };
    const place = (mesh: Mesh, piece: Piece, lift = 0) => {
      const height = Math.max(1e-3, piece.height * UNIT);
      mesh.scale.set(WIDTH, height, 0.7);
      mesh.position.set(
        columnX(piece.column),
        piece.bottom * UNIT + height / 2 + lift,
        0
      );
    };
    const drawGraph = () => {
      const index = (t: number) => Math.min(N - 1, Math.floor(t * N));
      graph.setSeries([
        {
          color: palette.ink,
          dashed: true,
          fn: (t) => table.probability[index(t)] ?? 0,
        },
        {
          color: palette.coral,
          fn: (t) => (draws > 0 ? (tally[index(t)] ?? 0) / draws : 0),
        },
      ]);
      graph.setMarker(1);
    };

    return {
      update({ dt }) {
        const nextPreset = String(params["preset"]);
        if (nextPreset !== preset) {
          preset = nextPreset;
          restart();
        }
        const last = table.steps.length - 1;
        const building = stepIndex < last;
        if (building) {
          stepTime += dt;
          if (stepTime > STEP_SECONDS) {
            stepTime = 0;
            stepIndex++;
          }
        }
        const step = table.steps[stepIndex];
        const previous = table.steps[Math.max(0, stepIndex - 1)];
        if (!step || !previous) {
          return;
        }
        const t = Math.min(1, stepTime / (STEP_SECONDS * 0.7));
        const eased = t * t * (3 - 2 * t);
        for (const piece of step.pieces) {
          const mesh = meshFor(piece);
          const before =
            step.from?.get(piece.id) ??
            previous.pieces.find((p) => p.id === piece.id) ??
            piece;
          const moving = building && stepIndex > 0 && step.from?.has(piece.id);
          place(
            mesh,
            {
              ...piece,
              column: before.column + (piece.column - before.column) * eased,
              bottom: before.bottom + (piece.bottom - before.bottom) * eased,
              height: before.height + (piece.height - before.height) * eased,
            },
            moving === true ? Math.sin(Math.PI * eased) * 0.9 : 0
          );
        }

        pick.visible = false;
        frame.visible = false;
        flash = Math.max(0, flash - dt);
        if (!building) {
          drawBudget += dt * Number(params["rate"]);
          while (drawBudget >= 1) {
            drawBudget -= 1;
            // 列を 1 つ一様に選び、0〜1 の乱数で下（自分）か上（エイリアス）かを決める
            const column = Math.floor(random() * N);
            const height = random();
            const item =
              height < (table.prob[column] ?? 1)
                ? column
                : (table.alias[column] ?? column);
            tally[item] = (tally[item] ?? 0) + 1;
            draws++;
            pick.position.set(columnX(column), height * UNIT, 0.45);
            const x0 = columnX(column) - WIDTH / 2 - 0.06;
            const x1 = columnX(column) + WIDTH / 2 + 0.06;
            const top = UNIT + 0.06;
            frame.setPoints([
              new Vector3(x0, -0.06, 0.4),
              new Vector3(x1, -0.06, 0.4),
              new Vector3(x1, -0.06, 0.4),
              new Vector3(x1, top, 0.4),
              new Vector3(x1, top, 0.4),
              new Vector3(x0, top, 0.4),
              new Vector3(x0, top, 0.4),
              new Vector3(x0, -0.06, 0.4),
            ]);
            result.setText(`${ITEMS[item]?.name ?? ""}！`);
            result.position.set(columnX(column), UNIT + 0.55, 0.4);
            flash = 0.6;
          }
          pick.visible = flash > 0;
          frame.visible = flash > 0;
        }
        result.visible = !building && flash > 0;
        drawGraph();
        context.readout(
          "手順",
          building ? `表を作成中 ${stepIndex} / ${last}` : "完成（抽選中）"
        );
        context.readout("抽選回数", `${draws}`);
        const linearCost = table.probability.reduce(
          (sum, p, i) => sum + p * (i + 1),
          0
        );
        context.readout(
          "1 回の抽選の比較回数",
          `1 回（先頭から足す方法は平均 ${linearCost.toFixed(2)} 回）`
        );
        context.caption(
          building
            ? step.note
            : "抽選は、列をサイコロで選び（白い枠）、0〜1 の乱数で高さを決める（白い点）。点が下の色なら列自身、上の色なら相手の品物（エイリアス）。品物がいくつあっても、手間は乱数 2 個と比較 1 回だけ。"
        );
      },
      action(key) {
        if (key === "rebuild") {
          restart();
        }
      },
    };
  },
};
