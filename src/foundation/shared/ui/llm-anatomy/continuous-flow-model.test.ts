import { expect, it } from "vite-plus/test";
import { CINEMA_DURATION, CINEMA_OPERATIONS } from "./cinema-timeline";
import {
  CONTINUOUS_OPERATION_IDS,
  continuousOperationProgress,
  continuousTransferProgress,
  continuousWindowProgress,
  createContinuousFlow,
  smoothFlowProgress,
} from "./continuous-flow-model";
import type {
  ContinuousConnection,
  ContinuousFlow,
  ContinuousNodeId,
} from "./continuous-flow-model";
import {
  chooseGeneration,
  DEFAULT_FLOW_IDS,
  FLOW_HEAD_DIMENSION,
  runGeneration,
} from "./generation-math";

const trace = runGeneration(DEFAULT_FLOW_IDS);
const selection = chooseGeneration(trace, 0.62);
const flow = createContinuousFlow(trace, selection);

function edge(
  from: ContinuousNodeId,
  to: ContinuousNodeId,
  channel?: string,
  model: ContinuousFlow = flow
): ContinuousConnection {
  const connection = model.connections.find(
    (candidate) =>
      candidate.from === from &&
      candidate.to === to &&
      (channel === undefined || candidate.id.endsWith(`:${channel}`))
  );
  if (!connection) {
    throw new Error(`必要な接続${from}→${to}がありません。`);
  }
  return connection;
}

function operation(id: string) {
  const found = flow.operations.find((candidate) => candidate.id === id);
  if (!found) {
    throw new Error(`必要な演算${id}がありません。`);
  }
  return found;
}

it("全24演算の時間範囲と静的な計算を保持し、1枚の回路として参照できる", () => {
  expect(CINEMA_OPERATIONS).toHaveLength(24);
  expect(flow.operations.map(({ id }) => id)).toStrictEqual(
    CONTINUOUS_OPERATION_IDS
  );
  let previousEnd = 0;
  for (const current of flow.operations) {
    expect(current.start).toBeCloseTo(previousEnd, 10);
    expect(current.duration).toBeGreaterThan(0);
    expect(current.end - current.start).toBe(current.duration);
    expect(current.frame.operationId).toBe(current.id);
    previousEnd = current.end;
  }
  expect(previousEnd).toBe(CINEMA_DURATION);
  const nodeIds = new Set<ContinuousNodeId>([
    ...CONTINUOUS_OPERATION_IDS,
    flow.support.id,
  ]);
  for (const connection of flow.connections) {
    expect(nodeIds.has(connection.from)).toBe(true);
    expect(nodeIds.has(connection.to)).toBe(true);
    expect(connection.payload.values).toHaveLength(
      connection.payload.shape.reduce(
        (product, dimension) => product * dimension,
        1
      )
    );
    expect(connection.payload.axes).toHaveLength(
      connection.payload.shape.length
    );
  }
  expect(new Set(flow.connections.map(({ id }) => id)).size).toBe(
    flow.connections.length
  );
});

it("過去の演算を完了状態に保ち、未来は0のまま現在の演算だけを連続させる", () => {
  const current = operation("qkv-key");
  expect(continuousOperationProgress(current, current.start - 1)).toBe(0);
  expect(continuousOperationProgress(current, current.start)).toBe(0);
  expect(
    continuousOperationProgress(current, current.start + current.duration / 2)
  ).toBeCloseTo(0.5, 12);
  expect(continuousOperationProgress(current, current.end)).toBe(1);
  expect(continuousOperationProgress(current, CINEMA_DURATION)).toBe(1);
  expect(continuousOperationProgress(current, Number.NaN)).toBe(0);
  expect(continuousOperationProgress(current, -Infinity)).toBe(0);
  expect(continuousOperationProgress(current, Infinity)).toBe(1);
  for (let elapsed = 0; elapsed <= CINEMA_DURATION; elapsed += 100) {
    for (const item of flow.operations) {
      const previous = continuousOperationProgress(item, elapsed - 0.1);
      const next = continuousOperationProgress(item, elapsed + 0.1);
      expect(next).toBeGreaterThanOrEqual(previous);
      expect(next - previous).toBeLessThan(0.0001);
    }
  }
});

it("補間窓は開始・終了の位置と速度を連続にし、場面の境界で飛ばない", () => {
  expect(smoothFlowProgress(-1)).toBe(0);
  expect(smoothFlowProgress(0.5)).toBe(0.5);
  expect(smoothFlowProgress(2)).toBe(1);
  expect(smoothFlowProgress(Number.NaN)).toBe(0);
  const delta = 1e-6;
  expect(smoothFlowProgress(delta) / delta).toBeLessThan(1e-5);
  expect((1 - smoothFlowProgress(1 - delta)) / delta).toBeLessThan(1e-5);
  expect(continuousWindowProgress(2500, 1000, 4000)).toBe(0.5);
  expect(() => continuousWindowProgress(1000, 4000, 1000)).toThrow(
    "連続補間の終了時刻は開始時刻より後にしてください。"
  );
  for (const boundary of CINEMA_OPERATIONS.map(({ start }) => start)) {
    for (const connection of flow.connections) {
      const before = continuousTransferProgress(
        flow,
        connection,
        boundary - 0.001
      );
      const after = continuousTransferProgress(
        flow,
        connection,
        boundary + 0.001
      );
      expect(after).toBeGreaterThanOrEqual(before);
      expect(after - before).toBeLessThan(1e-5);
    }
  }
});

it("演算の72%から実値を搬送し、下流の冒頭12%で到着させる", () => {
  const connection = edge("qkv-key", "score-mask-score");
  const source = operation(connection.from);
  const target = operation(connection.to);
  const start = source.start + source.duration * 0.72;
  const end = target.start + target.duration * 0.12;
  expect(continuousTransferProgress(flow, connection, start)).toBe(0);
  expect(continuousTransferProgress(flow, connection, (start + end) / 2)).toBe(
    0.5
  );
  expect(continuousTransferProgress(flow, connection, end)).toBe(1);
  expect(continuousTransferProgress(flow, connection, CINEMA_DURATION)).toBe(1);
});

it("IDによる表参照と位置加算を分け、参照段階でH⁰を先に表示しない", () => {
  const lookup = operation("embedding-lookup").computation;
  const addition = operation("embedding-add").computation;
  expect(lookup.output.values).toBe(trace.e.at(-1));
  expect(lookup.inputs[0]?.values).toStrictEqual([trace.ids.at(-1)]);
  expect(lookup.terms).toStrictEqual([]);
  expect(addition.output.values).toBe(trace.input.at(-1));
  expect(
    edge("embedding-lookup", "embedding-add").payload.values
  ).toStrictEqual(trace.e.flat());
});

it("Q・K・VをLN₁から分岐させ、対象位置の実際の入力行を運ぶ", () => {
  const query = edge("ln1", "qkv-query").payload;
  const key = edge("ln1", "qkv-key").payload;
  const value = edge("ln1", "qkv-value").payload;
  expect(query.values).toStrictEqual(trace.ln1.flat());
  expect(query.shape).toStrictEqual([3, 4]);
  expect(query.representative.values).toBe(trace.ln1.at(-1));
  expect(key.representative.values).toBe(trace.ln1[1]);
  expect(value.representative.values).toBe(trace.ln1[1]);
  expect(query.representative.values).toBe(
    operation("qkv-query").computation.inputs[0]?.values
  );
  expect(key.representative.values).toBe(
    operation("qkv-key").computation.inputs[0]?.values
  );
  expect(value.representative.values).toBe(
    operation("qkv-value").computation.inputs[0]?.values
  );
  expect(
    flow.connections.some(
      ({ from, to }) =>
        (from === "qkv-query" && to === "qkv-key") ||
        (from === "qkv-key" && to === "qkv-value")
    )
  ).toBe(false);
});

it("Head 2のQ/K/V・スコア・注意重みを独立に保ち、Head 1の値を流用しない", () => {
  expect(flow.support.input).toBe(trace.ln1);
  expect(flow.support.queries).toBe(trace.heads[1]?.queries);
  expect(flow.support.keys).toBe(trace.heads[1]?.keys);
  expect(flow.support.values).toBe(trace.heads[1]?.values);
  expect(flow.support.rawScores).toBe(trace.heads[1]?.rawScores);
  expect(flow.support.scores).toBe(trace.heads[1]?.scores);
  expect(flow.support.weights).toBe(trace.heads[1]?.weights);
  const firstWeights = edge("score-mask-mask", "weighted-head-1").payload;
  const secondWeights = edge(
    "head-2-preparation",
    "weighted-head-2",
    "weights"
  ).payload;
  const secondValues = edge(
    "head-2-preparation",
    "weighted-head-2",
    "values"
  ).payload;
  expect(firstWeights.values).toStrictEqual(trace.heads[0]?.weights.flat());
  expect(secondWeights.values).toStrictEqual(trace.heads[1]?.weights.flat());
  expect(secondValues.values).toStrictEqual(trace.heads[1]?.values.flat());
  expect(secondWeights.values).not.toStrictEqual(firstWeights.values);
  expect(secondWeights.representative.head).toBe(1);
  expect(secondValues.representative.head).toBe(1);
  expect(
    flow.connections
      .filter(({ to }) => to === "weighted-head-2")
      .map(({ from }) => from)
  ).toStrictEqual(["head-2-preparation", "head-2-preparation"]);
});

it.each([0, 1])(
  "搬送するHead %dのαと全位置Vから、全位置・全成分の出力を復元できる",
  (headIndex) => {
    const alpha =
      headIndex === 0
        ? edge("score-mask-mask", "weighted-head-1").payload
        : edge("head-2-preparation", "weighted-head-2", "weights").payload;
    const values =
      headIndex === 0
        ? edge("qkv-value", "weighted-head-1").payload
        : edge("head-2-preparation", "weighted-head-2", "values").payload;
    expect(alpha.shape).toStrictEqual([trace.ids.length, trace.ids.length]);
    expect(values.shape).toStrictEqual([trace.ids.length, FLOW_HEAD_DIMENSION]);
    for (let position = 0; position < trace.ids.length; position += 1) {
      for (let component = 0; component < FLOW_HEAD_DIMENSION; component += 1) {
        let sum = 0;
        for (let source = 0; source < trace.ids.length; source += 1) {
          sum +=
            (alpha.values[position * trace.ids.length + source] ?? 0) *
            (values.values[source * FLOW_HEAD_DIMENSION + component] ?? 0);
        }
        expect(sum).toBeCloseTo(
          trace.heads[headIndex]?.outputs[position]?.[component] ?? Number.NaN,
          13
        );
      }
    }
  }
);

it("2ヘッドを位置ごとに連結し、Wₒへ渡す4成分の順序を保つ", () => {
  const first = edge("weighted-head-1", "attention-output").payload;
  const second = edge("weighted-head-2", "attention-output").payload;
  expect(first.shape).toStrictEqual([3, 2]);
  expect(second.shape).toStrictEqual([3, 2]);
  for (let position = 0; position < trace.ids.length; position += 1) {
    const start = position * FLOW_HEAD_DIMENSION;
    expect([
      ...first.values.slice(start, start + FLOW_HEAD_DIMENSION),
      ...second.values.slice(start, start + FLOW_HEAD_DIMENSION),
    ]).toStrictEqual(trace.concatenated[position]);
  }
  expect([
    ...first.representative.values,
    ...second.representative.values,
  ]).toStrictEqual(operation("attention-output").computation.inputs[0]?.values);
});

it("残差の2経路に同じ未変換の値を保ち、正規化後の値に置き換えない", () => {
  expect(edge("embedding-add", "residual1").payload).toBe(
    edge("embedding-add", "ln1").payload
  );
  expect(edge("residual1", "residual2").payload).toBe(
    edge("residual1", "ln2").payload
  );
  expect(edge("embedding-add", "residual1").payload.values).toStrictEqual(
    trace.input.flat()
  );
  expect(edge("residual1", "residual2").payload.values).toStrictEqual(
    trace.afterAttention.flat()
  );
  expect(edge("residual1", "residual2").payload.values).not.toStrictEqual(
    trace.ln2.flat()
  );
});

it("末尾表現から全語彙スコア・確率・整数IDまで、同じ計算結果を保持する", () => {
  expect(edge("finalnorm", "logits").payload.values).toBe(trace.lastHidden);
  expect(edge("logits", "softmax").payload.values).toBe(trace.logits);
  expect(edge("softmax", "select").payload.values).toBe(trace.probabilities);
  expect(edge("softmax", "select").payload.shape).toStrictEqual([8]);
  expect(edge("select", "decode").payload.values).toStrictEqual([selection.id]);
});

it("表示用の復元を分岐させ、再トークン化せず保持した同じ整数IDを入力へ追加する", () => {
  expect(
    flow.connections.filter(({ from }) => from === "decode")
  ).toStrictEqual([]);
  expect(edge("select", "return").payload).toBe(
    edge("select", "decode").payload
  );
  expect(edge("tokenize", "return").payload.values).toBe(trace.ids);
  const feedback = edge("return", "embedding-lookup");
  expect(feedback.kind).toBe("feedback");
  expect(feedback.payload.values).toStrictEqual([...trace.ids, selection.id]);
  expect(feedback.to).not.toBe("tokenize");
  expect(continuousTransferProgress(flow, feedback, CINEMA_DURATION)).toBe(1);
  expect(trace.ids).toStrictEqual(DEFAULT_FLOW_IDS);
  expect(operation("embedding-lookup").computation.output.values).toBe(
    trace.e.at(-1)
  );
});

it("終了IDを選んだ場合は次の予測への搬送を止める", () => {
  const endSelection = chooseGeneration(trace, 1 - Number.EPSILON);
  expect(endSelection.isEnd).toBe(true);
  const ended = createContinuousFlow(trace, endSelection);
  const feedback = edge("return", "embedding-lookup", undefined, ended);
  expect(feedback.enabled).toBe(false);
  expect(continuousTransferProgress(ended, feedback, CINEMA_DURATION)).toBe(0);
});
