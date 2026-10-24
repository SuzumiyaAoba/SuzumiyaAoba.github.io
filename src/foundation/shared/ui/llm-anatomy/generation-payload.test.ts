import { expect, it } from "vite-plus/test";
import {
  chooseGeneration,
  decodeFlow,
  DEFAULT_FLOW_IDS,
  runGeneration,
} from "./generation-math";
import { generationPayloads } from "./generation-payload";
import { ROUTE_EDGES } from "./generation-route";

it("隣接ノード間で前段の出力と次段の入力を同じ値として受け渡す", () => {
  const trace = runGeneration(DEFAULT_FLOW_IDS);
  const payloads = generationPayloads(trace, chooseGeneration(trace, 0.62));
  for (const edge of ROUTE_EDGES.filter(({ kind }) => kind === "main")) {
    expect(payloads[edge.from].output).toBe(payloads[edge.to].input);
  }
});

it("各位置の中間表現を再計算や丸めをせず元の行列のまま保持する", () => {
  const trace = runGeneration(DEFAULT_FLOW_IDS);
  const payloads = generationPayloads(trace, chooseGeneration(trace, 0.62));
  for (const [payload, rows] of [
    [payloads.embedding.output, trace.input],
    [payloads.attention.output, trace.attention],
    [payloads["attention-add"].output, trace.afterAttention],
    [payloads.mlp.output, trace.mlpOutput],
    [payloads["mlp-add"].output, trace.afterMlp],
  ] as const) {
    expect(payload.rows).toBe(rows);
    expect(payload.rows).toHaveLength(DEFAULT_FLOW_IDS.length);
    expect(payload.shape).toBe("3 × 4");
    expect(payload.values).toBeUndefined();
  }
});

it("残差の支流には分岐時点のH⁰とUを保持し、主経路の変換値と区別する", () => {
  const trace = runGeneration(DEFAULT_FLOW_IDS);
  const payloads = generationPayloads(trace, chooseGeneration(trace, 0.62));
  const residuals = ROUTE_EDGES.filter(({ kind }) => kind === "residual");
  expect(residuals).toHaveLength(2);
  for (const [index, edge] of residuals.entries()) {
    const saved = payloads[edge.from].output;
    expect(saved.key).toBe(index === 0 ? "h0" : "u");
    expect(saved.rows).toBe(index === 0 ? trace.input : trace.afterAttention);
    expect(saved).not.toBe(payloads[edge.to].input);
    expect(payloads[edge.to].input.rows).toBe(
      index === 0 ? trace.attention : trace.mlpOutput
    );
  }
});

it("最終LayerNormの後に末尾の4成分を取り出し、8スコアと8確率へ渡す", () => {
  const trace = runGeneration(DEFAULT_FLOW_IDS);
  const payloads = generationPayloads(trace, chooseGeneration(trace, 0.62));
  expect(payloads["final-norm"].input.rows).toBe(trace.afterMlp);
  expect(payloads["final-norm"].output.values).toBe(trace.normalized.at(-1));
  expect(payloads["final-norm"].output.values).toBe(trace.lastHidden);
  expect(payloads["final-norm"].output.rows).toBeUndefined();
  expect(payloads["final-norm"].output.shape).toBe("4成分");
  expect(payloads.output.output.values).toBe(trace.logits);
  expect(payloads.output.output.shape).toBe("8個");
  expect(payloads.probabilities.output.values).toBe(trace.probabilities);
  expect(payloads.probabilities.output.shape).toBe("8個（合計1）");
});

it("選んだIDを復元後も保持し、文字片と再入力するIDを区別する", () => {
  const trace = runGeneration(DEFAULT_FLOW_IDS);
  const start = trace.probabilities
    .slice(0, 2)
    .reduce((sum, value) => sum + value, 0);
  const selection = chooseGeneration(
    trace,
    start + (trace.probabilities[2] ?? 0) / 2
  );
  const payloads = generationPayloads(trace, selection);
  expect(payloads.selection.output.selectedId).toBe(2);
  expect(payloads.selection.output.piece).toBeUndefined();
  expect(payloads.decode.output.selectedId).toBe(2);
  expect(payloads.decode.output.piece).toBe(decodeFlow([2]));
  expect(payloads.decode.output.piece).toBe("猫");
  expect(payloads.decode.output.summary).toContain("ID 2を追加");
  expect(payloads.return.output.selectedId).toBe(2);
  expect(payloads.return.output.ids).toStrictEqual([0, 1, 2, 2]);
});

it("追加済みID列を次の入力として返し、既存の計算traceを更新しない", () => {
  const trace = runGeneration(DEFAULT_FLOW_IDS);
  const selection = chooseGeneration(trace, 0.62);
  const payloads = generationPayloads(trace, selection);
  expect(payloads.input.input.summary).toBe("「私は猫」");
  expect(payloads.input.output.ids).toBe(trace.ids);
  expect(payloads.return.output.ids).not.toBe(trace.ids);
  expect(payloads.return.output.ids).toStrictEqual([
    ...trace.ids,
    selection.id,
  ]);
  expect(payloads.return.output.key).not.toBe(payloads.input.output.key);
  expect(payloads.return.output.summary).toContain("次の計算へ");
  expect(payloads.return.output.rows).toBeUndefined();
  expect(payloads.return.output.values).toBeUndefined();
  expect(trace.ids).toStrictEqual(DEFAULT_FLOW_IDS);
  expect(trace.input).toHaveLength(DEFAULT_FLOW_IDS.length);
});

it("終了IDを表示文字列にせず、追加後は生成終了であることを示す", () => {
  const trace = runGeneration(DEFAULT_FLOW_IDS);
  const selection = chooseGeneration(trace, 1 - Number.EPSILON);
  const payloads = generationPayloads(trace, selection);
  expect(selection.isEnd).toBe(true);
  expect(payloads.decode.output.selectedId).toBe(7);
  expect(payloads.decode.output.piece).toBe("");
  expect(payloads.decode.output.summary).toContain("生成を終了");
  expect(payloads.return.output.ids).toStrictEqual([0, 1, 2, 7]);
  expect(payloads.return.output.summary).toContain("生成終了");
});
