import {
  DEFAULT_FLOW_IDS,
  FLOW_DIMENSION,
  FLOW_HEAD_DIMENSION,
  FLOW_WEIGHTS,
} from "./generation-math";
import type { StoryStage } from "./generation-story-timeline";

export type CinemaKind =
  | "lookup"
  | "add"
  | "dot"
  | "norm"
  | "attention"
  | "gelu"
  | "probabilities"
  | "selection"
  | "decode";

export type CinemaFrame = {
  id: string;
  title: string;
  explanation: string;
  stage: StoryStage;
  progress: number;
  operationProgress: number;
  termProgress: number;
  kind: CinemaKind;
  chapterIndex: number;
  chapterProgress: number;
  operationId: string;
};

type CinemaChapter = {
  id: string;
  title: string;
  explanation: string;
  duration: number;
  start: number;
  end: number;
};

export type CinemaOperation = {
  id: string;
  kind: CinemaKind;
  stage: StoryStage;
  progress: number;
  title: string;
  explanation: string;
  chapterIndex: number;
  start: number;
  end: number;
  duration: number;
};

type Operation = {
  id: string;
  kind: CinemaKind;
  stage: StoryStage;
  progress: number;
  end: number;
  title?: string;
  explanation?: string;
  followOperationProgress?: boolean;
};

type ChapterDefinition = Omit<CinemaChapter, "start" | "end"> & {
  operations: readonly Operation[];
};

const PROCESS_END = 0.55;

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function middle(index: number, length: number): number {
  return (index + 0.5) / length;
}

function process(local: number): number {
  return local * PROCESS_END;
}

const THIRD_COMPONENT = middle(2, FLOW_DIMENSION);
const HEAD_COUNT = FLOW_WEIGHTS.heads.length;
const PROJECTION_SLOTS =
  HEAD_COUNT * DEFAULT_FLOW_IDS.length * FLOW_HEAD_DIMENSION;
const SCORE_SOURCE = middle(1, HEAD_COUNT * DEFAULT_FLOW_IDS.length);
const REPRESENTATIVES = {
  tokenize: process(middle(2, DEFAULT_FLOW_IDS.length)),
  embedding: process(THIRD_COMPONENT),
  ln1: process(0.05),
  query: process(0.1 + 0.15 * middle(0, HEAD_COUNT * FLOW_HEAD_DIMENSION)),
  key: process(0.25 + 0.15 * middle(FLOW_HEAD_DIMENSION, PROJECTION_SLOTS)),
  value: process(0.4 + 0.15 * middle(FLOW_HEAD_DIMENSION, PROJECTION_SLOTS)),
  score: process(0.55 + 0.13 * SCORE_SOURCE),
  mask: process(0.68 + 0.1 * SCORE_SOURCE),
  weightedFirst: process(
    0.78 + 0.12 * middle(0, HEAD_COUNT * FLOW_HEAD_DIMENSION)
  ),
  weightedSecond: process(
    0.78 + 0.12 * middle(FLOW_HEAD_DIMENSION, HEAD_COUNT * FLOW_HEAD_DIMENSION)
  ),
  attentionOutput: process(0.9 + 0.1 * THIRD_COMPONENT),
  residual: process(THIRD_COMPONENT),
  ln2: process(0.06),
  expand: process(0.12 + 0.31 * middle(0, 16)),
  gelu: process(0.43 + 0.22 * middle(0, 16)),
  contract: process(0.65 + 0.35 * THIRD_COMPONENT),
  finalNorm: 0.125,
  logits: 0.5 + 0.2 * middle(2, FLOW_WEIGHTS.lmHead.length),
  probabilities: process(middle(2, FLOW_WEIGHTS.lmHead.length)),
} as const;

const DEFINITIONS: readonly ChapterDefinition[] = [
  {
    id: "tokenize",
    title: "文字片を、整数のIDへ",
    explanation:
      "この教材の語彙で「猫」はID 2になる。IDは埋め込み表の行を選ぶための整数である。",
    duration: 7000,
    operations: [
      {
        id: "tokenize",
        kind: "lookup",
        stage: "input",
        progress: REPRESENTATIVES.tokenize,
        end: 1,
      },
    ],
  },
  {
    id: "embedding",
    title: "IDで表を引き、位置の情報を足す",
    explanation:
      "IDそのものを重みに掛けない。選んだ埋め込み行に、位置ベクトルを成分ごとに加える。",
    duration: 10_000,
    operations: [
      {
        id: "embedding-lookup",
        kind: "lookup",
        stage: "embedding",
        progress: REPRESENTATIVES.embedding,
        end: 0.4,
        title: "ID 2で埋め込み表の行を選ぶ",
        explanation:
          "整数ID 2を行番号として使い、4成分の埋め込みを取り出す。IDの数値をベクトルに掛ける演算ではない。",
      },
      {
        id: "embedding-add",
        kind: "add",
        stage: "embedding",
        progress: REPRESENTATIVES.embedding,
        end: 1,
        title: "位置ベクトルを足してH⁰を作る",
        explanation:
          "末尾位置の第3成分を追う。埋め込みの値と位置の値をそのまま加え、Attentionと残差の2経路へ同じH⁰を送る。",
      },
    ],
  },
  {
    id: "ln1",
    title: "LN₁：位置内の成分を正規化する",
    explanation:
      "同じ位置の4成分から平均と母分散を求め、ε・γ・βを使う。末尾位置の第3成分を追う。",
    duration: 8000,
    operations: [
      {
        id: "ln1",
        kind: "norm",
        stage: "attention",
        progress: REPRESENTATIVES.ln1,
        end: 1,
      },
    ],
  },
  {
    id: "qkv",
    title: "同じ正規化表現からQ・K・Vを作る",
    explanation:
      "Q・K・Vは別々の重みを使う線形変換である。Head 1の代表成分を一つずつ追う。",
    duration: 12_000,
    operations: [
      {
        id: "qkv-query",
        kind: "dot",
        stage: "attention",
        progress: REPRESENTATIVES.query,
        end: 1 / 3,
        title: "Q：末尾位置の問い合わせを作る",
      },
      {
        id: "qkv-key",
        kind: "dot",
        stage: "attention",
        progress: REPRESENTATIVES.key,
        end: 2 / 3,
        title: "K：参照元の照合用表現を作る",
      },
      {
        id: "qkv-value",
        kind: "dot",
        stage: "attention",
        progress: REPRESENTATIVES.value,
        end: 1,
        title: "V：参照元から集める表現を作る",
      },
    ],
  },
  {
    id: "score-mask",
    title: "照合スコアを求め、未来を隠す",
    explanation:
      "QとKの内積を√2で割る。causal mask後のスコアをsoftmaxへ渡し、注意重みを得る。",
    duration: 12_000,
    operations: [
      {
        id: "score-mask-score",
        kind: "dot",
        stage: "attention",
        progress: REPRESENTATIVES.score,
        end: 0.5,
        title: "QとKの内積から参照スコアへ",
        explanation:
          "Head 1の末尾位置と参照元2のスコアを追う。2項の内積をヘッド次元の平方根√2で割る。ここはmask前の値である。",
      },
      {
        id: "score-mask-mask",
        kind: "attention",
        stage: "attention",
        progress: REPRESENTATIVES.mask,
        end: 1,
        title: "未来を−∞にしてからsoftmaxへ",
        explanation:
          "行が参照する位置、列が参照元である。未来の列を−∞にすると、その注意重みは0になる。末尾位置はそれ以前のすべての位置を参照できる。",
      },
    ],
  },
  {
    id: "weighted",
    title: "注意重みでVを集める",
    explanation:
      "各参照元のVを注意重みで掛け、成分ごとに合計する。2ヘッドの第1成分を順に追う。",
    duration: 10_000,
    operations: [
      {
        id: "weighted-head-1",
        kind: "attention",
        stage: "attention",
        progress: REPRESENTATIVES.weightedFirst,
        end: 0.5,
        title: "Head 1：Vの加重和を求める",
      },
      {
        id: "weighted-head-2",
        kind: "attention",
        stage: "attention",
        progress: REPRESENTATIVES.weightedSecond,
        end: 1,
        title: "Head 2：別の重みでVを集める",
      },
    ],
  },
  {
    id: "attention-output",
    title: "2ヘッドを連結し、Wₒを掛ける",
    explanation:
      "各ヘッドの2成分を連結した4成分から、Attention出力Aの第3成分を求める。",
    duration: 8000,
    operations: [
      {
        id: "attention-output",
        kind: "dot",
        stage: "attention",
        progress: REPRESENTATIVES.attentionOutput,
        end: 1,
      },
    ],
  },
  {
    id: "residual1",
    title: "残差①：保持したH⁰とAを加える",
    explanation:
      "迂回した元のH⁰を、Attentionの出力Aへ成分ごとに加える。Uの第3成分を追う。",
    duration: 8000,
    operations: [
      {
        id: "residual1",
        kind: "add",
        stage: "attention-add",
        progress: REPRESENTATIVES.residual,
        end: 1,
      },
    ],
  },
  {
    id: "ln2",
    title: "LN₂：MLPへ渡す成分を正規化する",
    explanation:
      "残差①の出力Uを、位置ごとにLayerNormへ渡す。末尾位置の第3成分を追う。",
    duration: 8000,
    operations: [
      {
        id: "ln2",
        kind: "norm",
        stage: "mlp",
        progress: REPRESENTATIVES.ln2,
        end: 1,
      },
    ],
  },
  {
    id: "expand",
    title: "MLP前半：4成分を16成分へ広げる",
    explanation:
      "正規化した4成分とW₁の1行の内積にバイアスを足す。中間表現の第1成分を追う。",
    duration: 10_000,
    operations: [
      {
        id: "expand",
        kind: "dot",
        stage: "mlp",
        progress: REPRESENTATIVES.expand,
        end: 1,
      },
    ],
  },
  {
    id: "gelu",
    title: "GELU：中間成分を非線形に変換する",
    explanation:
      "16個の中間成分へそれぞれ同じGELU近似式を適用する。第1成分の変化を追う。",
    duration: 10_000,
    operations: [
      {
        id: "gelu",
        kind: "gelu",
        stage: "mlp",
        progress: REPRESENTATIVES.gelu,
        end: 1,
      },
    ],
  },
  {
    id: "contract",
    title: "MLP後半：16成分を4成分へ戻す",
    explanation:
      "GELU後の16成分とW₂の1行を掛け合わせて合計し、バイアスを足す。Mの第3成分を追う。",
    duration: 12_000,
    operations: [
      {
        id: "contract",
        kind: "dot",
        stage: "mlp",
        progress: REPRESENTATIVES.contract,
        end: 1,
      },
    ],
  },
  {
    id: "residual2",
    title: "残差②：保持したUとMを加える",
    explanation:
      "MLPを迂回したUと、MLP出力Mを成分ごとに加える。ブロック出力H′の第3成分を追う。",
    duration: 8000,
    operations: [
      {
        id: "residual2",
        kind: "add",
        stage: "mlp-add",
        progress: REPRESENTATIVES.residual,
        end: 1,
      },
    ],
  },
  {
    id: "finalnorm",
    title: "最終LayerNormを通し、末尾位置を使う",
    explanation:
      "H′の各位置を正規化し、次の予測には末尾位置の4成分を使う。第3成分の正規化を追う。",
    duration: 8000,
    operations: [
      {
        id: "finalnorm",
        kind: "norm",
        stage: "output",
        progress: REPRESENTATIVES.finalNorm,
        end: 1,
      },
    ],
  },
  {
    id: "logits",
    title: "末尾の表現を、語彙のスコアへ写す",
    explanation:
      "語彙ID 2の埋め込み行と、末尾の正規化表現hとの4項の内積を追う。同じ演算を8語彙に行う。",
    duration: 10_000,
    operations: [
      {
        id: "logits",
        kind: "dot",
        stage: "output",
        progress: REPRESENTATIVES.logits,
        end: 1,
      },
    ],
  },
  {
    id: "softmax",
    title: "8個のスコアから、合計1の確率へ",
    explanation:
      "最大値を引いた安定な指数と、その合計でID 2の確率を求める。8個の確率は同じ分母を使う。",
    duration: 10_000,
    operations: [
      {
        id: "softmax",
        kind: "probabilities",
        stage: "probabilities",
        progress: REPRESENTATIVES.probabilities,
        end: 1,
      },
    ],
  },
  {
    id: "select",
    title: "確率の幅で区切り、一つのIDを選ぶ",
    explanation:
      "同じ確率πを0〜1の区間の幅にする。抽選値0.62が入る区間のIDを選ぶ。",
    duration: 8000,
    operations: [
      {
        id: "select",
        kind: "selection",
        stage: "selection",
        progress: PROCESS_END,
        end: 1,
      },
    ],
  },
  {
    id: "decode-return",
    title: "文字片を復元し、同じIDを次の入力へ",
    explanation:
      "選んだIDから表示用の文字片を復元する。入力へ追加するのは同じ整数IDであり、文字列を再トークン化しない。",
    duration: 12_000,
    operations: [
      {
        id: "decode",
        kind: "decode",
        stage: "decode",
        progress: 0.4,
        end: 0.5,
        title: "整数IDから文字片を復元する",
      },
      {
        id: "return",
        kind: "decode",
        stage: "return",
        progress: 0,
        end: 1,
        followOperationProgress: true,
        title: "保持した整数IDを入力列へ追加する",
        explanation:
          "ID列を一つ長くし、次の予測の入力を用意する。ここで残る中間値は今回の計算結果であり、新しい入力での再計算はまだ行っていない。",
      },
    ],
  },
];

function buildChapters(): readonly CinemaChapter[] {
  const chapters: CinemaChapter[] = [];
  let start = 0;
  for (const definition of DEFINITIONS) {
    const end = start + definition.duration;
    chapters.push({
      id: definition.id,
      title: definition.title,
      explanation: definition.explanation,
      duration: definition.duration,
      start,
      end,
    });
    start = end;
  }
  return chapters;
}

export const CINEMA_CHAPTERS = buildChapters();
export const CINEMA_DURATION = CINEMA_CHAPTERS.at(-1)?.end ?? 0;

/** 常設する演算ノードの時間範囲。表示中の1演算に絞らず、全演算を保持する。 */
export const CINEMA_OPERATIONS: readonly CinemaOperation[] =
  DEFINITIONS.flatMap((definition, chapterIndex) => {
    const chapter = CINEMA_CHAPTERS[chapterIndex];
    if (!chapter) {
      throw new Error("演算の時間範囲に必要な章がありません。");
    }
    return definition.operations.map((operation, operationIndex) => {
      const previousEnd = definition.operations[operationIndex - 1]?.end ?? 0;
      const start = chapter.start + chapter.duration * previousEnd;
      const end = chapter.start + chapter.duration * operation.end;
      return {
        id: operation.id,
        kind: operation.kind,
        stage: operation.stage,
        progress: operation.progress,
        title: operation.title ?? chapter.title,
        explanation: operation.explanation ?? chapter.explanation,
        chapterIndex,
        start,
        end,
        duration: end - start,
      };
    });
  });

/** 代表する実演算を固定し、章内の小演算が変わるたびに飛行と途中和を0へ戻す。 */
export function cinemaFrame(elapsed: number): CinemaFrame {
  const time = Math.max(
    0,
    Math.min(CINEMA_DURATION, Number.isNaN(elapsed) ? 0 : elapsed)
  );
  const foundChapter = CINEMA_CHAPTERS.findIndex(({ end }) => time < end);
  const chapterIndex =
    foundChapter === -1 ? CINEMA_CHAPTERS.length - 1 : foundChapter;
  const chapter = CINEMA_CHAPTERS[chapterIndex];
  const definition = DEFINITIONS[chapterIndex];
  if (!chapter || !definition) {
    throw new Error("再生する計算の章がありません。");
  }
  const chapterProgress = clamp((time - chapter.start) / chapter.duration);
  const foundOperation = definition.operations.findIndex(
    ({ end }) => chapterProgress < end
  );
  const operationIndex =
    foundOperation === -1 ? definition.operations.length - 1 : foundOperation;
  const operation = definition.operations[operationIndex];
  if (!operation) {
    throw new Error("再生する計算の小演算がありません。");
  }
  const start = definition.operations[operationIndex - 1]?.end ?? 0;
  const operationProgress = clamp(
    (chapterProgress - start) / (operation.end - start)
  );
  return {
    id: chapter.id,
    title: operation.title ?? chapter.title,
    explanation: operation.explanation ?? chapter.explanation,
    stage: operation.stage,
    progress: operation.followOperationProgress
      ? operationProgress
      : operation.progress,
    operationProgress,
    termProgress: clamp(operationProgress / 0.8),
    kind: operation.kind,
    chapterIndex,
    chapterProgress,
    operationId: operation.id,
  };
}
