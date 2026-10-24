import {
  CINEMA_DURATION,
  CINEMA_OPERATIONS,
  cinemaFrame,
} from "./cinema-timeline";
import type { CinemaFrame, CinemaOperation } from "./cinema-timeline";
import { computationFrame } from "./generation-computation-model";
import type { ComputationFrame } from "./generation-computation-model";
import { FLOW_MAX_CONTEXT, FLOW_WEIGHTS } from "./generation-math";
import type {
  FlowMatrix,
  GenerationSelection,
  GenerationTrace,
} from "./generation-math";

export const CONTINUOUS_OPERATION_IDS = [
  "tokenize",
  "embedding-lookup",
  "embedding-add",
  "ln1",
  "qkv-query",
  "qkv-key",
  "qkv-value",
  "score-mask-score",
  "score-mask-mask",
  "weighted-head-1",
  "weighted-head-2",
  "attention-output",
  "residual1",
  "ln2",
  "expand",
  "gelu",
  "contract",
  "residual2",
  "finalnorm",
  "logits",
  "softmax",
  "select",
  "decode",
  "return",
] as const;

export type ContinuousOperationId = (typeof CONTINUOUS_OPERATION_IDS)[number];
export type ContinuousNodeId = ContinuousOperationId | "head-2-preparation";

export type ContinuousTiming = {
  start: number;
  end: number;
  duration: number;
};

export type ContinuousOperation = Omit<CinemaOperation, "id"> & {
  id: ContinuousOperationId;
  frame: CinemaFrame;
  computation: ComputationFrame;
};

export type ContinuousPayload = {
  label: string;
  values: readonly number[];
  shape: readonly number[];
  axes: readonly string[];
  representative: {
    label: string;
    values: readonly number[];
    head?: number;
    position?: number;
  };
};

export type ContinuousConnection = {
  id: string;
  from: ContinuousNodeId;
  to: ContinuousNodeId;
  kind: "data" | "residual" | "retained-id" | "feedback";
  payload: ContinuousPayload;
  enabled: boolean;
};

export type ContinuousSupportOperation = ContinuousTiming & {
  id: "head-2-preparation";
  title: string;
  formula: string;
  headIndex: number;
  input: FlowMatrix;
  queries: FlowMatrix;
  keys: FlowMatrix;
  values: FlowMatrix;
  rawScores: FlowMatrix;
  scores: FlowMatrix;
  weights: FlowMatrix;
};

export type ContinuousFlow = {
  operations: readonly ContinuousOperation[];
  connections: readonly ContinuousConnection[];
  support: ContinuousSupportOperation;
};

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Number.isNaN(value) ? 0 : value));
}

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(`連続図に必要な${label}がありません。`);
  }
  return value;
}

function operationId(id: string): ContinuousOperationId {
  const found = CONTINUOUS_OPERATION_IDS.find((candidate) => candidate === id);
  return required(found, `演算ID ${id}`);
}

function rowAt(matrix: FlowMatrix, position: number): readonly number[] {
  return required(matrix[position], `位置${position + 1}の値`);
}

function matrixPayload(
  label: string,
  rows: FlowMatrix,
  position: number,
  head?: number,
  axes: readonly string[] = ["位置", "成分"]
): ContinuousPayload {
  return {
    label,
    values: rows.flat(),
    shape: [rows.length, rowAt(rows, 0).length],
    axes,
    representative: {
      label: `${head === undefined ? "" : `Head ${head + 1}・`}位置${position + 1}`,
      values: rowAt(rows, position),
      position,
      ...(head === undefined ? {} : { head }),
    },
  };
}

function vectorPayload(
  label: string,
  values: readonly number[],
  axis: string
): ContinuousPayload {
  return {
    label,
    values,
    shape: [values.length],
    axes: [axis],
    representative: { label, values },
  };
}

function connect(
  from: ContinuousNodeId,
  to: ContinuousNodeId,
  payload: ContinuousPayload,
  kind: ContinuousConnection["kind"] = "data",
  channel = "",
  enabled = true
): ContinuousConnection {
  return {
    id: `${from}:${to}${channel ? `:${channel}` : ""}`,
    from,
    to,
    kind,
    payload,
    enabled,
  };
}

function timingOf(
  flow: ContinuousFlow,
  id: ContinuousNodeId
): ContinuousTiming {
  if (id === flow.support.id) {
    return flow.support;
  }
  return required(
    flow.operations.find((operation) => operation.id === id),
    `演算${id}の時間範囲`
  );
}

function operationComputation(
  trace: GenerationTrace,
  selection: GenerationSelection,
  frame: CinemaFrame
): ComputationFrame {
  const computation = computationFrame(
    trace,
    selection,
    frame.stage,
    frame.progress
  );
  if (frame.operationId !== "embedding-lookup") {
    return computation;
  }
  const position = trace.ids.length - 1;
  const id = required(trace.ids[position], "埋め込みを引くID");
  const values = rowAt(trace.e, position);
  return {
    ...computation,
    title: "整数IDで埋め込み表の行を引く",
    formula: `E[ID ${id}] → 4成分`,
    explanation:
      "整数IDは行番号として使う。選んだ埋め込み行へ位置ベクトルを足すのは次の演算である。",
    inputs: [{ label: "行番号としての整数ID", values: [id] }],
    output: { label: "埋め込み E[ID]", values },
    terms: [],
    result: required(values[computation.activeComponent], "埋め込みの代表成分"),
    matrices: [
      {
        label: "埋め込み表 E",
        rows: FLOW_WEIGHTS.embedding,
        activeRows: [id],
      },
    ],
  };
}

/** 端で速度が0になる補間。カメラと搬送を同じ連続時間で動かす。 */
export function smoothFlowProgress(progress: number): number {
  const value = clamp(progress);
  return value * value * (3 - 2 * value);
}

/** 開始前は0、完了後は1。過去のノードを0へリセットしない。 */
export function continuousOperationProgress(
  operation: ContinuousTiming,
  elapsed: number
): number {
  const time = Number.isNaN(elapsed) ? 0 : elapsed;
  return clamp((time - operation.start) / operation.duration);
}

export function continuousWindowProgress(
  elapsed: number,
  start: number,
  end: number
): number {
  if (!(end > start)) {
    throw new Error("連続補間の終了時刻は開始時刻より後にしてください。");
  }
  return smoothFlowProgress(
    continuousOperationProgress({ start, end, duration: end - start }, elapsed)
  );
}

/** 演算末尾の保持期間から次の入力まで搬送する。枝でも元の実値を保つ。 */
export function continuousTransferProgress(
  flow: ContinuousFlow,
  connection: ContinuousConnection,
  elapsed: number
): number {
  if (!connection.enabled) {
    return 0;
  }
  const source = timingOf(flow, connection.from);
  const target = timingOf(flow, connection.to);
  const start = source.start + source.duration * 0.72;
  const end =
    connection.kind === "feedback"
      ? CINEMA_DURATION
      : target.start + target.duration * 0.12;
  return continuousWindowProgress(elapsed, start, Math.max(start + 1, end));
}

/** 全ノード・全配線を一度作り、以後は時刻だけを連続的に進める。 */
export function createContinuousFlow(
  trace: GenerationTrace,
  selection: GenerationSelection
): ContinuousFlow {
  const operations = CINEMA_OPERATIONS.map((operation) => {
    const frame = cinemaFrame(operation.start + operation.duration / 2);
    return {
      ...operation,
      id: operationId(operation.id),
      frame,
      computation: operationComputation(trace, selection, frame),
    };
  });
  const lastPosition = trace.ids.length - 1;
  const sourcePosition = Math.min(1, lastPosition);
  const firstHead = required(trace.heads[0], "Head 1");
  const secondHead = required(trace.heads[1], "Head 2");
  const preparationStart = required(
    operations.find(({ id }) => id === "qkv-query"),
    "Q/K/Vの開始"
  ).start;
  const preparationEnd = required(
    operations.find(({ id }) => id === "score-mask-mask"),
    "注意重みの完了"
  ).end;
  const support: ContinuousSupportOperation = {
    id: "head-2-preparation",
    title: "Head 2も独立したQ・K・Vと注意重みを作る",
    formula: "Q₂, K₂, V₂ → Q₂K₂ᵀ/√2 → mask → softmax",
    headIndex: 1,
    start: preparationStart,
    end: preparationEnd,
    duration: preparationEnd - preparationStart,
    input: trace.ln1,
    queries: secondHead.queries,
    keys: secondHead.keys,
    values: secondHead.values,
    rawScores: secondHead.rawScores,
    scores: secondHead.scores,
    weights: secondHead.weights,
  };
  const initialIds = vectorPayload("今回の入力ID列", trace.ids, "位置");
  const input = matrixPayload("H⁰", trace.input, lastPosition);
  const normalized = matrixPayload("LN₁(H⁰)", trace.ln1, lastPosition);
  const normalizedSource = matrixPayload("LN₁(H⁰)", trace.ln1, sourcePosition);
  const afterAttention = matrixPayload("U", trace.afterAttention, lastPosition);
  const selectedId = vectorPayload("保持した整数ID", [selection.id], "選択ID");
  const nextIds = vectorPayload(
    "次回用に準備したID列（再計算はまだ行わない）",
    [...trace.ids, selection.id],
    "位置"
  );
  const connections = [
    connect("tokenize", "embedding-lookup", initialIds),
    connect(
      "embedding-lookup",
      "embedding-add",
      matrixPayload("埋め込み E[ID]", trace.e, lastPosition)
    ),
    connect("embedding-add", "ln1", input),
    connect("embedding-add", "residual1", input, "residual"),
    connect("ln1", "qkv-query", normalized),
    connect("ln1", "qkv-key", normalizedSource),
    connect("ln1", "qkv-value", normalizedSource),
    connect("ln1", "head-2-preparation", normalized),
    connect(
      "qkv-query",
      "score-mask-score",
      matrixPayload("Head 1・Q", firstHead.queries, lastPosition, 0)
    ),
    connect(
      "qkv-key",
      "score-mask-score",
      matrixPayload("Head 1・K", firstHead.keys, sourcePosition, 0)
    ),
    connect(
      "score-mask-score",
      "score-mask-mask",
      matrixPayload(
        "Head 1・mask前スコア",
        firstHead.rawScores,
        lastPosition,
        0,
        ["参照する位置", "参照元"]
      )
    ),
    connect(
      "score-mask-mask",
      "weighted-head-1",
      matrixPayload("Head 1・注意重み α₁", firstHead.weights, lastPosition, 0, [
        "参照する位置",
        "参照元",
      ])
    ),
    connect(
      "qkv-value",
      "weighted-head-1",
      matrixPayload("Head 1・V", firstHead.values, sourcePosition, 0)
    ),
    connect(
      "head-2-preparation",
      "weighted-head-2",
      matrixPayload(
        "Head 2・注意重み α₂",
        secondHead.weights,
        lastPosition,
        1,
        ["参照する位置", "参照元"]
      ),
      "data",
      "weights"
    ),
    connect(
      "head-2-preparation",
      "weighted-head-2",
      matrixPayload("Head 2・V", secondHead.values, sourcePosition, 1),
      "data",
      "values"
    ),
    connect(
      "weighted-head-1",
      "attention-output",
      matrixPayload(
        "Head 1の2成分（concat前半）",
        firstHead.outputs,
        lastPosition,
        0
      )
    ),
    connect(
      "weighted-head-2",
      "attention-output",
      matrixPayload(
        "Head 2の2成分（concat後半）",
        secondHead.outputs,
        lastPosition,
        1
      )
    ),
    connect(
      "attention-output",
      "residual1",
      matrixPayload("Attention出力 A", trace.attention, lastPosition)
    ),
    connect("residual1", "ln2", afterAttention),
    connect("residual1", "residual2", afterAttention, "residual"),
    connect("ln2", "expand", matrixPayload("LN₂(U)", trace.ln2, lastPosition)),
    connect(
      "expand",
      "gelu",
      matrixPayload("GELU前 z", trace.mlpPre, lastPosition)
    ),
    connect(
      "gelu",
      "contract",
      matrixPayload("GELU後 g", trace.mlpActivated, lastPosition)
    ),
    connect(
      "contract",
      "residual2",
      matrixPayload("MLP出力 M", trace.mlpOutput, lastPosition)
    ),
    connect(
      "residual2",
      "finalnorm",
      matrixPayload("ブロック出力 H′", trace.afterMlp, lastPosition)
    ),
    connect(
      "finalnorm",
      "logits",
      vectorPayload("末尾位置の正規化表現 h", trace.lastHidden, "成分")
    ),
    connect(
      "logits",
      "softmax",
      vectorPayload("語彙スコア z", trace.logits, "語彙ID")
    ),
    connect(
      "softmax",
      "select",
      vectorPayload("確率 π", trace.probabilities, "語彙ID")
    ),
    connect("select", "decode", selectedId),
    connect("select", "return", selectedId, "retained-id"),
    connect("tokenize", "return", initialIds, "retained-id"),
    connect(
      "return",
      "embedding-lookup",
      nextIds,
      "feedback",
      "",
      !selection.isEnd && trace.ids.length < FLOW_MAX_CONTEXT
    ),
  ];
  return { operations, connections, support };
}
