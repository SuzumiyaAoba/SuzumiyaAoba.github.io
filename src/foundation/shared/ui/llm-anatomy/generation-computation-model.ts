import {
  decodeFlow,
  FLOW_DIMENSION,
  FLOW_EPSILON,
  FLOW_HEAD_DIMENSION,
  FLOW_VOCABULARY,
  FLOW_WEIGHTS,
} from "./generation-math";
import type {
  FlowMatrix,
  FlowNormalizationStatistics,
  GenerationSelection,
  GenerationTrace,
} from "./generation-math";
import { routeFrame } from "./generation-route";
import type { RouteNodeId } from "./generation-route";
import type { StoryStage } from "./generation-story-timeline";

export type ComputationFrame = {
  nodeId: RouteNodeId;
  title: string;
  formula: string;
  explanation: string;
  activeComponent: number;
  componentLabel: string;
  inputs: readonly {
    label: string;
    values: readonly number[];
    activeIndices?: readonly number[];
    indexLabels?: readonly string[];
  }[];
  output: {
    label: string;
    values: readonly number[];
    indexLabels?: readonly string[];
  };
  terms: readonly {
    label: string;
    left: number;
    right: number;
    product: number;
  }[];
  termMode?: "products" | "addends";
  bias: number;
  divisor?: number;
  result: number;
  resultText?: string;
  matrices: readonly {
    label: string;
    rows: FlowMatrix;
    activeRows?: readonly number[];
    activeColumns?: readonly number[];
    rowLabels?: readonly string[];
    columnLabels?: readonly string[];
  }[];
};

type FrameDetails = Pick<
  ComputationFrame,
  "nodeId" | "title" | "formula" | "explanation" | "activeComponent" | "output"
> &
  Partial<ComputationFrame>;

type NormalizationParameters = {
  gamma: readonly number[];
  beta: readonly number[];
};

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function indexAt(progress: number, length: number): number {
  return Math.min(length - 1, Math.floor(clamp(progress) * length));
}

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(`計算表示に必要な${label}がありません。`);
  }
  return value;
}

function rowAt(rows: FlowMatrix, position: number): readonly number[] {
  return required(rows[position], `位置${position}の行`);
}

function componentAt(values: readonly number[], component: number): number {
  return required(values[component], `成分${component}`);
}

function buildFrame(details: FrameDetails): ComputationFrame {
  return {
    inputs: [],
    terms: [],
    bias: 0,
    matrices: [],
    result: componentAt(details.output.values, details.activeComponent),
    componentLabel: `第${details.activeComponent + 1}成分`,
    ...details,
  };
}

function positionLabels(length: number): string[] {
  return Array.from({ length }, (_, index) => `位置${index + 1}`);
}

const VOCABULARY_LABELS = FLOW_VOCABULARY.map(({ id }) => `ID ${id}`);

function productTerms(left: readonly number[], right: readonly number[]) {
  return left.map((value, index) => {
    const other = componentAt(right, index);
    return {
      label: `成分${index + 1}`,
      left: value,
      right: other,
      product: value * other,
    };
  });
}

function addFrame(
  nodeId: RouteNodeId,
  title: string,
  labels: readonly [string, string, string],
  matrices: readonly [FlowMatrix, FlowMatrix, FlowMatrix],
  progress: number
): ComputationFrame {
  const position = matrices[0].length - 1;
  const component = indexAt(progress, FLOW_DIMENSION);
  const left = rowAt(matrices[0], position);
  const right = rowAt(matrices[1], position);
  return buildFrame({
    nodeId,
    title,
    formula: `${labels[2]}ᵢ = ${labels[0]}ᵢ + ${labels[1]}ᵢ`,
    explanation: `末尾位置${position + 1}の成分${component + 1}を表示する。同じ位置・同じ成分どうしを加え、全位置で同じ形の行列を得る。`,
    activeComponent: component,
    inputs: [
      { label: labels[0], values: left, activeIndices: [component] },
      { label: labels[1], values: right, activeIndices: [component] },
    ],
    output: { label: labels[2], values: rowAt(matrices[2], position) },
    termMode: "addends",
    terms: [
      {
        label: labels[0],
        left: componentAt(left, component),
        right: 1,
        product: componentAt(left, component),
      },
      {
        label: labels[1],
        left: componentAt(right, component),
        right: 1,
        product: componentAt(right, component),
      },
    ],
    matrices: matrices.map((rows, index) => ({
      label: required(labels[index], "加算対象名"),
      rows,
      activeRows: [position],
      activeColumns: [component],
    })),
  });
}

function normalizationFrame(
  nodeId: RouteNodeId,
  label: string,
  input: FlowMatrix,
  output: FlowMatrix,
  statistics: readonly FlowNormalizationStatistics[],
  parameters: NormalizationParameters,
  progress: number
): ComputationFrame {
  const position = input.length - 1;
  const component = indexAt(progress, FLOW_DIMENSION);
  const values = rowAt(input, position);
  const stats = required(statistics[position], "LayerNormの統計量");
  const standardized = values.map(
    (value) => (value - stats.mean) / stats.denominator
  );
  const gamma = componentAt(parameters.gamma, component);
  const centered = componentAt(standardized, component);
  return buildFrame({
    nodeId,
    title: `${label}：位置内の4成分を正規化`,
    formula: "yᵢ = γᵢ × (xᵢ − μ) / √(σ² + ε) + βᵢ",
    explanation: `末尾位置${position + 1}の成分${component + 1}を表示する。平均と母分散は、この位置の4成分から求める。γ・βを適用した実際の出力を次の演算へ渡す。`,
    activeComponent: component,
    inputs: [
      { label: "入力 x", values, activeIndices: [component] },
      { label: "平均 μ", values: [stats.mean] },
      { label: "母分散 σ²", values: [stats.variance] },
      { label: "ε", values: [FLOW_EPSILON] },
      { label: "√(σ² + ε)", values: [stats.denominator] },
      {
        label: "標準化した成分",
        values: standardized,
        activeIndices: [component],
      },
      { label: "γ", values: parameters.gamma, activeIndices: [component] },
      { label: "β", values: parameters.beta, activeIndices: [component] },
    ],
    output: {
      label:
        label === "最終LayerNorm" ? "末尾の正規化表現 h" : `${label}の出力`,
      values: rowAt(output, position),
    },
    terms: [
      {
        label: "標準化 × γ",
        left: centered,
        right: gamma,
        product: centered * gamma,
      },
    ],
    bias: componentAt(parameters.beta, component),
    matrices: [
      {
        label: "正規化前（全位置）",
        rows: input,
        activeRows: [position],
        activeColumns: [component],
      },
      {
        label: `${label}後（全位置）`,
        rows: output,
        activeRows: [position],
        activeColumns: [component],
      },
    ],
  });
}

function linearFrame(
  nodeId: RouteNodeId,
  title: string,
  formula: string,
  explanation: string,
  inputLabel: string,
  input: readonly number[],
  outputLabel: string,
  output: readonly number[],
  weightLabel: string,
  weights: FlowMatrix,
  progress: number,
  bias: readonly number[] = []
): ComputationFrame {
  const component = indexAt(progress, output.length);
  const row = rowAt(weights, component);
  return buildFrame({
    nodeId,
    title,
    formula,
    explanation,
    activeComponent: component,
    inputs: [
      {
        label: inputLabel,
        values: input,
        activeIndices: input.map((_, index) => index),
      },
      {
        label: `${weightLabel}の行${component + 1}`,
        values: row,
        activeIndices: row.map((_, index) => index),
      },
    ],
    output: { label: outputLabel, values: output },
    terms: productTerms(row, input),
    bias: bias[component] ?? 0,
    matrices: [
      {
        label: weightLabel,
        rows: weights,
        activeRows: [component],
        ...(nodeId === "output" ? { rowLabels: VOCABULARY_LABELS } : {}),
      },
    ],
  });
}

function stableExponents(values: readonly number[], temperature = 1) {
  const maximum = Math.max(...values);
  const exponents = values.map((value) =>
    Math.exp((value - maximum) / temperature)
  );
  let denominator = 0;
  for (const value of exponents) {
    denominator += value;
  }
  return { maximum, exponents, denominator };
}

function attentionProjection(
  trace: GenerationTrace,
  kind: "query" | "key" | "value",
  progress: number
): ComputationFrame {
  const perHead =
    kind === "query"
      ? FLOW_HEAD_DIMENSION
      : trace.ids.length * FLOW_HEAD_DIMENSION;
  const index = indexAt(progress, trace.heads.length * perHead);
  const headIndex = Math.floor(index / perHead);
  const position =
    kind === "query"
      ? trace.ids.length - 1
      : Math.floor((index % perHead) / FLOW_HEAD_DIMENSION);
  const component = index % FLOW_HEAD_DIMENSION;
  const head = required(trace.heads[headIndex], "Attentionヘッド");
  const weights = required(FLOW_WEIGHTS.heads[headIndex], "Attention重み");
  const resultKey =
    kind === "query" ? "queries" : kind === "key" ? "keys" : "values";
  const symbol = kind === "query" ? "Q" : kind === "key" ? "K" : "V";
  const result = linearFrame(
    "attention",
    `Head ${headIndex + 1}：${symbol}を作る`,
    `${symbol}ᵢ = Σⱼ W${symbol}[i,j] × LN₁(H⁰)ⱼ`,
    `位置${position + 1}の${symbol}・成分${component + 1}を表示する。Qは末尾の参照先を決める側、K・Vは各参照元の表現から作る。2ヘッドは別の重みを使う。`,
    `LN₁の出力（位置${position + 1}）`,
    rowAt(trace.ln1, position),
    `Head ${headIndex + 1}・${symbol}（位置${position + 1}）`,
    rowAt(head[resultKey], position),
    `W${symbol}・Head ${headIndex + 1}`,
    weights[kind],
    component / FLOW_HEAD_DIMENSION
  );
  return {
    ...result,
    matrices: [
      { label: "LN₁の出力（全位置）", rows: trace.ln1, activeRows: [position] },
      ...result.matrices,
      {
        label: `${symbol}・Head ${headIndex + 1}（全位置）`,
        rows: head[resultKey],
        activeRows: [position],
        activeColumns: [component],
      },
    ],
  };
}

function attentionFrame(
  trace: GenerationTrace,
  progress: number
): ComputationFrame {
  const position = trace.ids.length - 1;
  if (progress < 0.1) {
    return normalizationFrame(
      "attention",
      "LN₁",
      trace.input,
      trace.ln1,
      trace.ln1Statistics,
      FLOW_WEIGHTS.ln1,
      progress / 0.1
    );
  }
  if (progress < 0.25) {
    return attentionProjection(trace, "query", (progress - 0.1) / 0.15);
  }
  if (progress < 0.4) {
    return attentionProjection(trace, "key", (progress - 0.25) / 0.15);
  }
  if (progress < 0.55) {
    return attentionProjection(trace, "value", (progress - 0.4) / 0.15);
  }
  if (progress >= 0.9) {
    const frame = linearFrame(
      "attention",
      "2ヘッドを連結し、Wₒで4成分へ",
      "Aᵢ = Σⱼ Wₒ[i,j] × concat(head₁,head₂)ⱼ",
      "各ヘッドの2成分を連結した4成分にWₒを掛ける。この出力Aを、保持していたH⁰との残差加算へ渡す。",
      "ヘッドの連結結果",
      rowAt(trace.concatenated, position),
      "Attentionの出力 A",
      rowAt(trace.attention, position),
      "Wₒ",
      FLOW_WEIGHTS.output,
      (progress - 0.9) / 0.1
    );
    return {
      ...frame,
      matrices: [
        {
          label: "2ヘッドの連結（全位置）",
          rows: trace.concatenated,
          activeRows: [position],
        },
        ...frame.matrices,
        {
          label: "Attention出力A（全位置）",
          rows: trace.attention,
          activeRows: [position],
          activeColumns: [frame.activeComponent],
        },
      ],
    };
  }
  const start = progress < 0.68 ? 0.55 : progress < 0.78 ? 0.68 : 0.78;
  const duration = progress < 0.68 ? 0.13 : progress < 0.78 ? 0.1 : 0.12;
  const local = clamp((progress - start) / duration);
  const slots = progress < 0.78 ? trace.ids.length : FLOW_HEAD_DIMENSION;
  const index = indexAt(local, trace.heads.length * slots);
  const headIndex = Math.floor(index / slots);
  const component = index % slots;
  const head = required(trace.heads[headIndex], "Attentionヘッド");
  if (progress < 0.68) {
    const query = rowAt(head.queries, position);
    const key = rowAt(head.keys, component);
    return buildFrame({
      nodeId: "attention",
      title: `Head ${headIndex + 1}：参照元${component + 1}とのスコア`,
      formula: "sₜⱼ = (Σᵢ Qₜᵢ × Kⱼᵢ) / √2",
      explanation:
        "QとKの内積をヘッド次元の平方根で割る。ここはmask前のスコアである。次に未来位置を−∞へ置き換える。",
      activeComponent: component,
      componentLabel: `参照元${component + 1}とのスコア`,
      inputs: [
        { label: `Q（位置${position + 1}）`, values: query },
        { label: `K（参照元${component + 1}）`, values: key },
      ],
      output: {
        label: "末尾位置のmask前スコア",
        values: rowAt(head.rawScores, position),
        indexLabels: positionLabels(trace.ids.length),
      },
      terms: productTerms(query, key),
      divisor: Math.sqrt(FLOW_HEAD_DIMENSION),
      matrices: [
        { label: "Q（全位置）", rows: head.queries, activeRows: [position] },
        { label: "K（全位置）", rows: head.keys, activeRows: [component] },
        {
          label: "QKᵀ/√2：mask前",
          rows: head.rawScores,
          activeRows: [position],
          activeColumns: [component],
        },
      ],
    });
  }
  if (progress < 0.78) {
    const scores = rowAt(head.scores, position);
    const stable = stableExponents(scores);
    return buildFrame({
      nodeId: "attention",
      title: `Head ${headIndex + 1}：causal mask → softmax`,
      formula: "αⱼ = exp(sⱼ − max(s)) / Σₖ exp(sₖ − max(s))",
      explanation:
        "スコア行列の行が参照する位置、列が参照元である。未来の列はmask後に−∞となり、指数は0、注意重みも0になる。mask前の実数スコアとは区別する。",
      activeComponent: component,
      componentLabel: `参照元${component + 1}への注意重み`,
      inputs: [
        {
          label: "mask後のスコア",
          values: scores,
          activeIndices: [component],
          indexLabels: positionLabels(trace.ids.length),
        },
        { label: "最大値", values: [stable.maximum] },
        {
          label: "安定化後の指数",
          values: stable.exponents,
          activeIndices: [component],
          indexLabels: positionLabels(trace.ids.length),
        },
        { label: "指数の合計", values: [stable.denominator] },
      ],
      output: {
        label: `Head ${headIndex + 1}・末尾位置の注意重み α`,
        values: rowAt(head.weights, position),
        indexLabels: positionLabels(trace.ids.length),
      },
      matrices: [
        {
          label: "mask前スコア",
          rows: head.rawScores,
          activeRows: [position],
          activeColumns: [component],
        },
        {
          label: "mask後スコア：未来は−∞",
          rows: head.scores,
          activeRows: [position],
          activeColumns: [component],
        },
        {
          label: "注意重み：未来は0",
          rows: head.weights,
          activeRows: [position],
          activeColumns: [component],
        },
      ],
    });
  }
  const weights = rowAt(head.weights, position);
  return buildFrame({
    nodeId: "attention",
    title: `Head ${headIndex + 1}：Vの加重和`,
    formula: "headₜᵢ = Σⱼ αₜⱼ × Vⱼᵢ",
    explanation: `末尾位置の成分${component + 1}に、参照元ごとのVが注意重みに応じて加わる。成分ごとに加重和を求め、ヘッドの2成分を得る。`,
    activeComponent: component,
    inputs: [
      {
        label: "注意重み α",
        values: weights,
        indexLabels: positionLabels(trace.ids.length),
      },
      {
        label: `各参照元のV・成分${component + 1}`,
        values: head.values.map((row) => componentAt(row, component)),
        indexLabels: positionLabels(trace.ids.length),
      },
    ],
    output: {
      label: `Head ${headIndex + 1}の出力`,
      values: rowAt(head.outputs, position),
    },
    terms: weights.map((weight, source) => ({
      label: `参照元${source + 1}`,
      left: weight,
      right: componentAt(rowAt(head.values, source), component),
      product: componentAt(
        rowAt(required(head.contributions[position], "重み付きV"), source),
        component
      ),
    })),
    matrices: [
      { label: "V（全参照元）", rows: head.values, activeColumns: [component] },
      {
        label: "各参照元の重み付きV",
        rows: required(head.contributions[position], "重み付きV"),
        activeColumns: [component],
      },
      {
        label: "ヘッド出力（全位置）",
        rows: head.outputs,
        activeRows: [position],
        activeColumns: [component],
      },
    ],
  });
}

function mlpFrame(trace: GenerationTrace, progress: number): ComputationFrame {
  const position = trace.ids.length - 1;
  if (progress < 0.12) {
    return normalizationFrame(
      "mlp",
      "LN₂",
      trace.afterAttention,
      trace.ln2,
      trace.ln2Statistics,
      FLOW_WEIGHTS.ln2,
      progress / 0.12
    );
  }
  if (progress < 0.43) {
    const frame = linearFrame(
      "mlp",
      "MLP前半：4 → 16成分",
      "zᵢ = Σⱼ W₁[i,j] × LN₂(U)ⱼ + b₁ᵢ",
      "同じ位置の4成分から16個の中間成分を作る。位置間の値は混ぜない。",
      "LN₂の出力",
      rowAt(trace.ln2, position),
      "MLP中間表現 z（GELU前）",
      rowAt(trace.mlpPre, position),
      "W₁（16×4）",
      FLOW_WEIGHTS.mlp.first,
      (progress - 0.12) / 0.31,
      FLOW_WEIGHTS.mlp.firstBias
    );
    return {
      ...frame,
      matrices: [
        ...frame.matrices,
        {
          label: "中間16成分（全位置・GELU前）",
          rows: trace.mlpPre,
          activeRows: [position],
          activeColumns: [frame.activeComponent],
        },
      ],
    };
  }
  if (progress < 0.65) {
    const component = indexAt((progress - 0.43) / 0.22, 16);
    return buildFrame({
      nodeId: "mlp",
      title: "MLP中間：GELUの非線形変換",
      formula: "gᵢ = ½zᵢ(1 + tanh(√(2/π)(zᵢ + 0.044715zᵢ³)))",
      explanation:
        "GPT-2と同じtanh近似のGELUを用いる。16成分それぞれに同じ非線形式を適用し、次の線形変換へ渡す。表示値は丸め前の計算traceを参照する。",
      activeComponent: component,
      inputs: [
        {
          label: "GELU前 z",
          values: rowAt(trace.mlpPre, position),
          activeIndices: [component],
        },
      ],
      output: {
        label: "GELU後 g（16成分）",
        values: rowAt(trace.mlpActivated, position),
      },
      matrices: [
        {
          label: "GELU前（全位置）",
          rows: trace.mlpPre,
          activeRows: [position],
          activeColumns: [component],
        },
        {
          label: "GELU後（全位置）",
          rows: trace.mlpActivated,
          activeRows: [position],
          activeColumns: [component],
        },
      ],
    });
  }
  const frame = linearFrame(
    "mlp",
    "MLP後半：16 → 4成分",
    "Mᵢ = Σⱼ W₂[i,j] × gⱼ + b₂ᵢ",
    "GELU後の16成分を4成分へ戻す。この出力Mを、保持していたUとの残差加算へ渡す。",
    "GELU後 g（16成分）",
    rowAt(trace.mlpActivated, position),
    "MLPの出力 M",
    rowAt(trace.mlpOutput, position),
    "W₂（4×16）",
    FLOW_WEIGHTS.mlp.second,
    (progress - 0.65) / 0.35,
    FLOW_WEIGHTS.mlp.secondBias
  );
  return {
    ...frame,
    matrices: [
      ...frame.matrices,
      {
        label: "MLP出力（全位置）",
        rows: trace.mlpOutput,
        activeRows: [position],
        activeColumns: [frame.activeComponent],
      },
    ],
  };
}

function probabilityFrame(
  trace: GenerationTrace,
  progress: number
): ComputationFrame {
  const component = indexAt(progress, trace.logits.length);
  const stable = stableExponents(trace.logits, trace.temperature);
  return buildFrame({
    nodeId: "probabilities",
    title: `softmax：ID ${component}の確率`,
    formula: "πᵢ = exp((zᵢ − m)/T) / Σⱼ exp((zⱼ − m)/T), m = max(z)",
    explanation:
      "最大スコアを引いて指数計算を安定させる。すべての指数を同じ分母で割るため確率の合計は1になる。温度Tを変えるのはこの写像であり、直前のlogitは変わらない。",
    activeComponent: component,
    componentLabel: `ID ${component}の確率`,
    inputs: [
      {
        label: "語彙スコア z",
        values: trace.logits,
        activeIndices: [component],
        indexLabels: VOCABULARY_LABELS,
      },
      { label: "最大値 m", values: [stable.maximum] },
      { label: "温度 T", values: [trace.temperature] },
      {
        label: "exp((z − m)/T)",
        values: stable.exponents,
        activeIndices: [component],
        indexLabels: VOCABULARY_LABELS,
      },
      { label: "分母：指数の合計", values: [stable.denominator] },
    ],
    output: {
      label: "各IDの確率 π",
      values: trace.probabilities,
      indexLabels: VOCABULARY_LABELS,
    },
    matrices: [
      {
        label: "IDごとのスコア・指数・確率",
        rows: trace.logits.map((logit, tokenId) => [
          logit,
          componentAt(stable.exponents, tokenId),
          componentAt(trace.probabilities, tokenId),
        ]),
        activeRows: [component],
        rowLabels: VOCABULARY_LABELS,
        columnLabels: ["z", "exp", "π"],
      },
    ],
  });
}

function selectionFrame(
  trace: GenerationTrace,
  selection: GenerationSelection,
  progress: number
): ComputationFrame {
  const intervals: number[][] = [];
  let start = 0;
  for (const [tokenId, probability] of trace.probabilities.entries()) {
    const end =
      tokenId === trace.probabilities.length - 1 ? 1 : start + probability;
    intervals.push([start, end]);
    start += probability;
  }
  const currentId = indexAt(progress, selection.id + 1);
  return buildFrame({
    nodeId: "selection",
    title: `累積確率：ID ${currentId}の区間を確認`,
    formula: "r ∈ [Cᵢ, Cᵢ + πᵢ) ⇒ 選択ID = i",
    explanation: `各確率を順に足して0〜1を区切る。抽選値rが入った半開区間の整数ID ${selection.id}を選ぶ。最大確率のIDを必ず選ぶ規則ではない。`,
    activeComponent: 0,
    componentLabel: `選択した整数ID ${selection.id}`,
    inputs: [
      {
        label: "確率 π",
        values: trace.probabilities,
        activeIndices: [currentId],
        indexLabels: VOCABULARY_LABELS,
      },
      {
        label: `確認中のID ${currentId}の区間`,
        values: rowAt(intervals, currentId),
        indexLabels: ["開始", "終了"],
      },
      {
        label: "選択したIDの区間",
        values: [selection.intervalStart, selection.intervalEnd],
        indexLabels: ["開始", "終了"],
      },
    ],
    output: { label: "選択した整数ID", values: [selection.id] },
    matrices: [
      {
        label: "IDごとの区間 [開始, 終了)",
        rows: intervals,
        activeRows: [currentId],
        rowLabels: VOCABULARY_LABELS,
        columnLabels: ["開始", "終了"],
      },
    ],
  });
}

/** 全体図と同じノード・同じtraceに同期し、計算中だけ成分を自動で進める。 */
export function computationFrame(
  trace: GenerationTrace,
  selection: GenerationSelection,
  stage: StoryStage,
  progress: number
): ComputationFrame {
  const { activeNodeId } = routeFrame(stage, progress);
  let local = clamp(progress / 0.55);
  if (stage === "output") {
    local =
      activeNodeId === "final-norm"
        ? clamp(progress / 0.25)
        : clamp((progress - 0.5) / 0.2);
  }
  const position = trace.ids.length - 1;
  switch (activeNodeId) {
    case "input": {
      const component = indexAt(local, trace.ids.length);
      const id = componentAt(trace.ids, component);
      return buildFrame({
        nodeId: "input",
        title: "文字片とIDを対応させる",
        formula: `tokenize(「${decodeFlow(trace.ids)}」) → [${trace.ids.join(", ")}]`,
        explanation: `この教材の語彙は1 IDに1文字片を対応させる。位置${component + 1}の「${FLOW_VOCABULARY[id]?.piece}」はID ${id}である。実在のトークナイザーの分割を再現したものではない。`,
        activeComponent: component,
        componentLabel: `第${component + 1}位置のID`,
        inputs: [
          {
            label: "教材の語彙ID",
            values: FLOW_VOCABULARY.map((entry) => entry.id),
            activeIndices: [id],
            indexLabels: VOCABULARY_LABELS,
          },
        ],
        output: {
          label: "入力ID列",
          values: trace.ids,
          indexLabels: positionLabels(trace.ids.length),
        },
      });
    }
    case "embedding": {
      return addFrame(
        "embedding",
        "埋め込みに位置情報を足す",
        ["E[ID]", "P", "H⁰"],
        [trace.e, trace.p, trace.input],
        local
      );
    }
    case "attention": {
      return attentionFrame(trace, local);
    }
    case "attention-add": {
      return addFrame(
        "attention-add",
        "残差加算①：H⁰とAを合流",
        ["保持したH⁰", "Attention出力A", "U"],
        [trace.input, trace.attention, trace.afterAttention],
        local
      );
    }
    case "mlp": {
      return mlpFrame(trace, local);
    }
    case "mlp-add": {
      return addFrame(
        "mlp-add",
        "残差加算②：UとMを合流",
        ["保持したU", "MLP出力M", "H′"],
        [trace.afterAttention, trace.mlpOutput, trace.afterMlp],
        local
      );
    }
    case "final-norm": {
      return normalizationFrame(
        "final-norm",
        "最終LayerNorm",
        trace.afterMlp,
        trace.normalized,
        trace.finalStatistics,
        FLOW_WEIGHTS.finalNorm,
        local
      );
    }
    case "output": {
      const frame = linearFrame(
        "output",
        `語彙スコア：ID ${indexAt(local, trace.logits.length)}`,
        "zᵢ = Σⱼ E[i,j] × hⱼ",
        `最終LayerNorm後の末尾位置${position + 1}の4成分と、語彙IDごとの行との内積を求める。この教材では埋め込み表と出力重みを共有する。`,
        "末尾の正規化表現 h",
        trace.lastHidden,
        "8個の語彙スコア z",
        trace.logits,
        "共有埋め込み表 E（8×4）",
        FLOW_WEIGHTS.lmHead,
        local
      );
      return {
        ...frame,
        componentLabel: `ID ${frame.activeComponent}のスコア`,
        output: { ...frame.output, indexLabels: VOCABULARY_LABELS },
      };
    }
    case "probabilities": {
      return probabilityFrame(trace, local);
    }
    case "selection": {
      return selectionFrame(trace, selection, local);
    }
    case "decode": {
      const piece = decodeFlow([selection.id]);
      return buildFrame({
        nodeId: "decode",
        title: "選択IDから文字片を復元",
        formula: `decode([${selection.id}]) →「${piece}」`,
        explanation: selection.isEnd
          ? "終了IDは表示文字列へ追加せず、生成を終了する。整数IDと表示用文字列は別の値である。"
          : `語彙表のID ${selection.id}から文字片「${piece}」を復元して表示する。次の入力へ追加する整数ID ${selection.id}も保持する。`,
        activeComponent: 0,
        componentLabel: `整数ID ${selection.id}から復元`,
        inputs: [{ label: "選択した整数ID", values: [selection.id] }],
        output: { label: "復元後も保持する整数ID", values: [selection.id] },
        resultText: selection.isEnd ? "生成終了" : `「${piece}」`,
      });
    }
    case "return": {
      const nextIds = [...trace.ids, selection.id];
      return buildFrame({
        nodeId: "return",
        title: "選んだ整数IDを次の入力へ追加",
        formula: `[${trace.ids.join(", ")}] ⧺ [${selection.id}] → [${nextIds.join(", ")}]`,
        explanation: selection.isEnd
          ? "終了IDを受け取ったので生成は終了する。次の予測は実行しない。"
          : "復元した文字列を再トークン化せず、選んだ同じ整数IDを追加する。この長くなったID列の次の計算はまだ実行していない。",
        activeComponent: nextIds.length - 1,
        componentLabel: `末尾に追加するID ${selection.id}`,
        inputs: [
          {
            label: "今回の入力ID列",
            values: trace.ids,
            indexLabels: positionLabels(trace.ids.length),
          },
          {
            label: "追加する整数ID",
            values: [selection.id],
            activeIndices: [0],
          },
        ],
        output: {
          label: selection.isEnd ? "終了IDを含むID列" : "次の予測の入力ID列",
          values: nextIds,
          indexLabels: positionLabels(nextIds.length),
        },
        resultText: `[${nextIds.join(", ")}]`,
      });
    }
    default: {
      throw new Error("計算表示に対応しないノードです。");
    }
  }
}
