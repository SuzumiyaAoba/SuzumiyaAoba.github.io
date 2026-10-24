import { sampleIndex, softmax } from "./probability";
import { approximateGelu } from "./representation-math";

export const FLOW_DIMENSION = 4;
export const FLOW_HEAD_DIMENSION = 2;
export const FLOW_MAX_CONTEXT = 8;
export const FLOW_EPSILON = 1e-5;

export const FLOW_VOCABULARY = [
  { id: 0, piece: "私", isEnd: false },
  { id: 1, piece: "は", isEnd: false },
  { id: 2, piece: "猫", isEnd: false },
  { id: 3, piece: "犬", isEnd: false },
  { id: 4, piece: "が", isEnd: false },
  { id: 5, piece: "好き", isEnd: false },
  { id: 6, piece: "。", isEnd: false },
  { id: 7, piece: "〈終了〉", isEnd: true },
] as const;

export const DEFAULT_FLOW_IDS = [0, 1, 2] as const;

export type FlowMatrix = readonly (readonly number[])[];

type LayerNormParameters = {
  gamma: readonly number[];
  beta: readonly number[];
};

export type FlowNormalizationStatistics = {
  mean: number;
  variance: number;
  denominator: number;
};

export type GenerationHeadTrace = {
  queries: FlowMatrix;
  keys: FlowMatrix;
  values: FlowMatrix;
  rawScores: FlowMatrix;
  scores: FlowMatrix;
  weights: FlowMatrix;
  contributions: readonly FlowMatrix[];
  outputs: FlowMatrix;
};

export type GenerationTrace = {
  ids: readonly number[];
  temperature: number;
  e: FlowMatrix;
  p: FlowMatrix;
  input: FlowMatrix;
  ln1: FlowMatrix;
  ln1Statistics: readonly FlowNormalizationStatistics[];
  heads: readonly GenerationHeadTrace[];
  concatenated: FlowMatrix;
  attention: FlowMatrix;
  afterAttention: FlowMatrix;
  ln2: FlowMatrix;
  ln2Statistics: readonly FlowNormalizationStatistics[];
  mlpPre: FlowMatrix;
  mlpActivated: FlowMatrix;
  mlpOutput: FlowMatrix;
  afterMlp: FlowMatrix;
  normalized: FlowMatrix;
  finalStatistics: readonly FlowNormalizationStatistics[];
  lastHidden: readonly number[];
  logits: readonly number[];
  probabilities: readonly number[];
};

export type GenerationSelection = {
  id: number;
  piece: string;
  probability: number;
  intervalStart: number;
  intervalEnd: number;
  isEnd: boolean;
};

/** 整数の剰余から固定値を作る。学習や乱数による生成は行っていない。 */
function fixedMatrix(
  rows: number,
  columns: number,
  seed: number,
  divisor: number
): number[][] {
  return Array.from({ length: rows }, (_rowValue, row) =>
    Array.from(
      { length: columns },
      (_columnValue, column) =>
        ((((row + 1) * (column + 2) * (seed + 1) +
          row * 3 +
          column * 5 +
          seed) %
          19) -
          9) /
        divisor
    )
  );
}

const FLOW_EMBEDDINGS = [
  [0.7, -0.4, 0.2, 0.5],
  [-0.2, 0.6, 0.4, -0.3],
  [0.5, 0.1, -0.6, 0.8],
  [-0.4, 0.3, 0.7, 0.2],
  [0.2, -0.5, 0.6, -0.1],
  [0.8, 0.4, -0.2, -0.6],
  [-0.5, -0.2, 0.1, 0.7],
  [0.1, 0.8, -0.4, -0.5],
] as const;

// すべて説明用の固定パラメーター。実在モデルの学習済み重みではない。
// ベクトルは列ベクトルとして計算し、重み行列は「出力次元×入力次元」。
export const FLOW_WEIGHTS = {
  embedding: FLOW_EMBEDDINGS,
  // learned positional embedding と同じ加算方式の固定表。学習は行わない。
  positional: Array.from({ length: FLOW_MAX_CONTEXT }, (_rowValue, position) =>
    Array.from(
      { length: FLOW_DIMENSION },
      (_columnValue, component) =>
        ((((position + 1) * (component + 2)) % 11) - 5) / 25
    )
  ),
  ln1: { gamma: [1.05, 0.95, 1.1, 0.9], beta: [0.02, -0.03, 0.01, 0] },
  heads: [2, 5].map((seed) => ({
    query: fixedMatrix(FLOW_HEAD_DIMENSION, FLOW_DIMENSION, seed, 12),
    key: fixedMatrix(FLOW_HEAD_DIMENSION, FLOW_DIMENSION, seed + 1, 12),
    value: fixedMatrix(FLOW_HEAD_DIMENSION, FLOW_DIMENSION, seed + 2, 12),
  })),
  output: fixedMatrix(FLOW_DIMENSION, FLOW_DIMENSION, 11, 16),
  ln2: { gamma: [0.95, 1.1, 1, 1.05], beta: [-0.01, 0.02, 0, -0.02] },
  mlp: {
    first: fixedMatrix(16, FLOW_DIMENSION, 13, 18),
    firstBias: Array.from({ length: 16 }, (_, index) => ((index % 5) - 2) / 50),
    second: fixedMatrix(FLOW_DIMENSION, 16, 17, 24),
    secondBias: [0.01, -0.02, 0.03, -0.01],
  },
  finalNorm: { gamma: [1, 0.95, 1.05, 1], beta: [0, 0.01, -0.01, 0.02] },
  lmHead: FLOW_EMBEDDINGS,
  vocabulary: FLOW_EMBEDDINGS,
} as const;

function dot(left: readonly number[], right: readonly number[]): number {
  return left.reduce(
    (sum, component, index) => sum + component * (right[index] ?? 0),
    0
  );
}

function project(
  matrix: FlowMatrix,
  vector: readonly number[],
  bias?: readonly number[]
): number[] {
  return matrix.map((row, index) => dot(row, vector) + (bias?.[index] ?? 0));
}

function addRows(left: FlowMatrix, right: FlowMatrix): number[][] {
  return left.map((row, position) =>
    row.map((component, index) => component + (right[position]?.[index] ?? 0))
  );
}

function normalizeRows(input: FlowMatrix, parameters: LayerNormParameters) {
  const statistics = input.map((row) => {
    const mean = row.reduce((sum, value) => sum + value, 0) / row.length;
    const variance =
      row.reduce((sum, value) => sum + (value - mean) ** 2, 0) / row.length;
    return { mean, variance, denominator: Math.sqrt(variance + FLOW_EPSILON) };
  });
  const rows = input.map((row, position) => {
    const { mean, denominator } = statistics[position] ?? {
      mean: 0,
      denominator: 1,
    };
    return row.map(
      (value, component) =>
        ((value - mean) / denominator) * (parameters.gamma[component] ?? 1) +
        (parameters.beta[component] ?? 0)
    );
  });
  return { rows, statistics };
}

function traceHead(
  input: FlowMatrix,
  weights: (typeof FLOW_WEIGHTS.heads)[number]
): GenerationHeadTrace {
  const queries = input.map((row) => project(weights.query, row));
  const keys = input.map((row) => project(weights.key, row));
  const values = input.map((row) => project(weights.value, row));
  const rawScores = queries.map((query) =>
    keys.map((key) => dot(query, key) / Math.sqrt(FLOW_HEAD_DIMENSION))
  );
  const scores = rawScores.map((row, target) =>
    row.map((score, source) => (source <= target ? score : -Infinity))
  );
  const weightsByPosition = scores.map((row) => softmax(row));
  const contributions = weightsByPosition.map((row) =>
    values.map((value, source) =>
      value.map((component) => component * (row[source] ?? 0))
    )
  );
  const outputs = contributions.map((bySource) =>
    Array.from({ length: FLOW_HEAD_DIMENSION }, (_, component) =>
      bySource.reduce((sum, value) => sum + (value[component] ?? 0), 0)
    )
  );
  return {
    queries,
    keys,
    values,
    rawScores,
    scores,
    weights: weightsByPosition,
    contributions,
    outputs,
  };
}

function validateIds(ids: readonly number[], requireInput: boolean): void {
  if (requireInput && (ids.length === 0 || ids.length > FLOW_MAX_CONTEXT)) {
    throw new Error(
      `入力は1個以上${FLOW_MAX_CONTEXT}個以下のID列にしてください。`
    );
  }
  if (
    ids.some(
      (id) => !Number.isInteger(id) || id < 0 || id >= FLOW_VOCABULARY.length
    )
  ) {
    throw new Error("IDは説明用語彙に存在する整数を指定してください。");
  }
}

/** 1 Pre-LNブロックの全計算。途中の値を丸めず、各段階の実値を返す。 */
export function runGeneration(
  ids: readonly number[],
  temperature = 1
): GenerationTrace {
  validateIds(ids, true);
  const e = ids.map((id) => [...(FLOW_WEIGHTS.embedding[id] ?? [])]);
  const p = ids.map((_, position) => [
    ...(FLOW_WEIGHTS.positional[position] ?? []),
  ]);
  const input = addRows(e, p);
  const firstNorm = normalizeRows(input, FLOW_WEIGHTS.ln1);
  const heads = FLOW_WEIGHTS.heads.map((weights) =>
    traceHead(firstNorm.rows, weights)
  );
  const concatenated = ids.map((_, position) =>
    heads.flatMap((head) => head.outputs[position] ?? [])
  );
  const attention = concatenated.map((row) =>
    project(FLOW_WEIGHTS.output, row)
  );
  const afterAttention = addRows(input, attention);
  const secondNorm = normalizeRows(afterAttention, FLOW_WEIGHTS.ln2);
  const mlpPre = secondNorm.rows.map((row) =>
    project(FLOW_WEIGHTS.mlp.first, row, FLOW_WEIGHTS.mlp.firstBias)
  );
  const mlpActivated = mlpPre.map((row) => row.map(approximateGelu));
  const mlpOutput = mlpActivated.map((row) =>
    project(FLOW_WEIGHTS.mlp.second, row, FLOW_WEIGHTS.mlp.secondBias)
  );
  const afterMlp = addRows(afterAttention, mlpOutput);
  const finalNorm = normalizeRows(afterMlp, FLOW_WEIGHTS.finalNorm);
  const lastHidden = finalNorm.rows.at(-1) ?? [];
  const logits = project(FLOW_WEIGHTS.lmHead, lastHidden);
  const probabilities = softmax(logits, temperature);
  return {
    ids: [...ids],
    temperature,
    e,
    p,
    input,
    ln1: firstNorm.rows,
    ln1Statistics: firstNorm.statistics,
    heads,
    concatenated,
    attention,
    afterAttention,
    ln2: secondNorm.rows,
    ln2Statistics: secondNorm.statistics,
    mlpPre,
    mlpActivated,
    mlpOutput,
    afterMlp,
    normalized: finalNorm.rows,
    finalStatistics: finalNorm.statistics,
    lastHidden,
    logits,
    probabilities,
  };
}

/** 確率区間を実際のIDに変換する。表示用の丸め値は抽選に使わない。 */
export function chooseGeneration(
  trace: GenerationTrace,
  draw: number
): GenerationSelection {
  const index = sampleIndex(trace.probabilities, draw);
  const entry = FLOW_VOCABULARY[index];
  if (entry === undefined) {
    throw new Error("選択したIDが説明用語彙に存在しません。");
  }
  const intervalStart = trace.probabilities
    .slice(0, index)
    .reduce((sum, value) => sum + value, 0);
  const probability = trace.probabilities[index] ?? 0;
  const intervalEnd =
    index === trace.probabilities.length - 1 ? 1 : intervalStart + probability;
  return { ...entry, probability, intervalStart, intervalEnd };
}

/** この教材の語彙は1 ID＝1断片。終端IDは文字列に含めず、そこで終了する。 */
export function decodeFlow(ids: readonly number[]): string {
  validateIds(ids, false);
  let text = "";
  for (const id of ids) {
    const entry = FLOW_VOCABULARY[id];
    if (entry?.isEnd) {
      break;
    }
    text += entry?.piece ?? "";
  }
  return text;
}
