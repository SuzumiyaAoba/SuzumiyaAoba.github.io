import { expect, it } from "vite-plus/test";
import { computationFrame } from "./generation-computation-model";
import type { ComputationFrame } from "./generation-computation-model";
import {
  chooseGeneration,
  DEFAULT_FLOW_IDS,
  FLOW_EPSILON,
  FLOW_WEIGHTS,
  runGeneration,
} from "./generation-math";
import { ROUTE_NODES, routeFrame } from "./generation-route";
import { STORY_PHASES } from "./generation-story-timeline";
import type { StoryStage } from "./generation-story-timeline";
import { approximateGelu } from "./representation-math";

const trace = runGeneration(DEFAULT_FLOW_IDS);
const selection = chooseGeneration(trace, 0.62);

function localFrame(stage: StoryStage, progress: number): ComputationFrame {
  return computationFrame(trace, selection, stage, progress * 0.55);
}

function inputValues(
  frame: ComputationFrame,
  label: string
): readonly number[] {
  const input = frame.inputs.find((candidate) => candidate.label === label);
  if (!input) {
    throw new Error(`入力${label}が必要です。`);
  }
  return input.values;
}

function expectReconstruction(frame: ComputationFrame): void {
  if (frame.terms.length === 0) {
    return;
  }
  let sum = 0;
  for (const term of frame.terms) {
    expect(term.product).toBe(term.left * term.right);
    sum += term.product;
  }
  expect((sum + frame.bias) / (frame.divisor ?? 1)).toBeCloseTo(
    frame.result,
    12
  );
}

it("全12ノードを全体図と同期し、積和・加算の実値から表示結果を再構成できる", () => {
  const visited = new Set<string>();
  for (const phase of STORY_PHASES) {
    for (let step = 0; step <= 240; step += 1) {
      const progress = step / 240;
      const frame = computationFrame(trace, selection, phase.stage, progress);
      visited.add(frame.nodeId);
      expect(frame.nodeId).toBe(routeFrame(phase.stage, progress).activeNodeId);
      expect(frame.activeComponent).toBeGreaterThanOrEqual(0);
      expect(frame.activeComponent).toBeLessThan(frame.output.values.length);
      expect(frame.result).toBe(frame.output.values[frame.activeComponent]);
      expect(frame.componentLabel.length).toBeGreaterThan(0);
      expectReconstruction(frame);
    }
  }
  expect(visited).toStrictEqual(new Set(ROUTE_NODES.map(({ id }) => id)));
});

it.each([
  ["embedding", trace.e, trace.p, trace.input],
  ["attention-add", trace.input, trace.attention, trace.afterAttention],
  ["mlp-add", trace.afterAttention, trace.mlpOutput, trace.afterMlp],
] as const)(
  "%sは元の行列の同じ成分を加算する",
  (stage, left, right, output) => {
    for (let component = 0; component < 4; component += 1) {
      const frame = localFrame(stage, (component + 0.5) / 4);
      expect(frame.activeComponent).toBe(component);
      expect(frame.termMode).toBe("addends");
      expect(frame.inputs[0]?.values).toBe(left.at(-1));
      expect(frame.inputs[1]?.values).toBe(right.at(-1));
      expect(frame.output.values).toBe(output.at(-1));
      expect(frame.terms.map(({ left: value }) => value)).toStrictEqual([
        left.at(-1)?.[component],
        right.at(-1)?.[component],
      ]);
      expectReconstruction(frame);
    }
  }
);

it.each([
  ["attention", 0.05 * 0.55, trace.input, trace.ln1, FLOW_WEIGHTS.ln1],
  ["mlp", 0.06 * 0.55, trace.afterAttention, trace.ln2, FLOW_WEIGHTS.ln2],
  ["output", 0.125, trace.afterMlp, trace.normalized, FLOW_WEIGHTS.finalNorm],
] as const)(
  "%s内のLayerNormは母分散・ε・γ・βから出力を再構成する",
  (stage, progress, input, output, parameters) => {
    const frame = computationFrame(trace, selection, stage, progress);
    const row = input.at(-1) ?? [];
    let mean = 0;
    for (const value of row) {
      mean += value / row.length;
    }
    let variance = 0;
    for (const value of row) {
      variance += (value - mean) ** 2 / row.length;
    }
    expect(inputValues(frame, "平均 μ")[0]).toBeCloseTo(mean, 14);
    expect(inputValues(frame, "母分散 σ²")[0]).toBeCloseTo(variance, 14);
    expect(inputValues(frame, "ε")[0]).toBe(FLOW_EPSILON);
    expect(inputValues(frame, "√(σ² + ε)")[0]).toBeCloseTo(
      Math.sqrt(variance + FLOW_EPSILON),
      14
    );
    expect(frame.output.values).toBe(output.at(-1));
    expect(frame.inputs.find(({ label }) => label === "γ")?.values).toBe(
      parameters.gamma
    );
    expect(frame.inputs.find(({ label }) => label === "β")?.values).toBe(
      parameters.beta
    );
    expectReconstruction(frame);
  }
);

it("AttentionでQ・K・V両ヘッド、scaled score、mask、加重和、Woを実traceから表示する", () => {
  const frames = Array.from({ length: 401 }, (_, step) =>
    localFrame("attention", step / 400)
  );
  const projected = frames.filter(({ title }) => title.includes("を作る"));
  const projectedHeads = new Set(projected.map(({ title }) => title));
  for (const frame of projected) {
    const outputInTrace = trace.heads.some((head) =>
      [head.queries, head.keys, head.values].some((matrix) =>
        matrix.some((row) => row === frame.output.values)
      )
    );
    expect(outputInTrace).toBe(true);
  }
  const scaled = frames.filter(({ divisor }) => divisor !== undefined);
  expect(scaled.length).toBeGreaterThan(0);
  for (const frame of scaled) {
    expect(frame.divisor).toBe(Math.sqrt(2));
    expect(frame.formula).toContain("√2");
  }
  const maskedFrames = frames.filter(({ title }) =>
    title.includes("causal mask")
  );
  expect(maskedFrames.length).toBeGreaterThan(0);
  for (const frame of maskedFrames) {
    const masked = frame.matrices.find(({ label }) => label.includes("mask後"));
    const raw = frame.matrices.find(({ label }) => label.includes("mask前"));
    expect(masked?.rows[0]?.[1]).toBe(-Infinity);
    expect(Number.isFinite(raw?.rows[0]?.[1])).toBe(true);
    expect(frame.explanation).toContain("mask前の実数スコアとは区別");
  }
  for (const frame of frames) {
    expectReconstruction(frame);
  }
  expect(projectedHeads).toStrictEqual(
    new Set([
      "Head 1：Qを作る",
      "Head 2：Qを作る",
      "Head 1：Kを作る",
      "Head 2：Kを作る",
      "Head 1：Vを作る",
      "Head 2：Vを作る",
    ])
  );
  expect(frames.some(({ title }) => title.includes("Vの加重和"))).toBe(true);
  expect(localFrame("attention", 1).output.values).toBe(trace.attention.at(-1));
});

it("MLPは16個の中間成分を隠さず、GELUと後半の16項の内積を区別する", () => {
  const frames = Array.from({ length: 401 }, (_, step) =>
    localFrame("mlp", step / 400)
  );
  const first = frames.filter(({ title }) => title.includes("前半"));
  const gelu = frames.filter(({ title }) => title.includes("GELU"));
  const second = frames.filter(({ title }) => title.includes("後半"));
  const firstComponents = new Set(
    first.map(({ activeComponent }) => activeComponent)
  );
  const geluComponents = new Set(
    gelu.map(({ activeComponent }) => activeComponent)
  );
  for (const frame of first) {
    expect(frame.output.values).toBe(trace.mlpPre.at(-1));
    expect(frame.output.values).toHaveLength(16);
    expect(frame.terms).toHaveLength(4);
    expect(frame.bias).toBe(FLOW_WEIGHTS.mlp.firstBias[frame.activeComponent]);
  }
  for (const frame of gelu) {
    expect(frame.output.values).toBe(trace.mlpActivated.at(-1));
    expect(frame.result).toBe(
      approximateGelu(trace.mlpPre.at(-1)?.[frame.activeComponent] ?? 0)
    );
    expect(frame.terms).toHaveLength(0);
  }
  expect(second.length).toBeGreaterThan(0);
  for (const frame of second) {
    expect(frame.output.values).toBe(trace.mlpOutput.at(-1));
    expect(frame.terms).toHaveLength(16);
  }
  for (const frame of frames) {
    expectReconstruction(frame);
  }
  expect([...firstComponents]).toStrictEqual(
    Array.from({ length: 16 }, (_, index) => index)
  );
  expect([...geluComponents]).toStrictEqual(
    Array.from({ length: 16 }, (_, index) => index)
  );
});

it("LM headは8語彙の行を順に選び、各行と末尾4成分の内積を表示する", () => {
  for (let tokenId = 0; tokenId < 8; tokenId += 1) {
    const frame = computationFrame(
      trace,
      selection,
      "output",
      0.5 + ((tokenId + 0.5) / 8) * 0.2
    );
    expect(frame.nodeId).toBe("output");
    expect(frame.activeComponent).toBe(tokenId);
    expect(frame.componentLabel).toBe(`ID ${tokenId}のスコア`);
    expect(frame.inputs[0]?.values).toBe(trace.lastHidden);
    expect(frame.inputs[1]?.values).toBe(FLOW_WEIGHTS.lmHead[tokenId]);
    expect(frame.output.values).toBe(trace.logits);
    expect(frame.terms).toHaveLength(4);
    expectReconstruction(frame);
  }
});

it.each([0.05, 1, 3])(
  "温度%sのsoftmaxは最大値を引いた指数と真の分母から元の確率を再構成する",
  (temperature) => {
    const changed = runGeneration(DEFAULT_FLOW_IDS, temperature);
    const selected = chooseGeneration(changed, 0.62);
    for (let tokenId = 0; tokenId < 8; tokenId += 1) {
      const frame = computationFrame(
        changed,
        selected,
        "probabilities",
        ((tokenId + 0.5) / 8) * 0.55
      );
      const exponents = inputValues(frame, "exp((z − m)/T)");
      const denominator = inputValues(frame, "分母：指数の合計")[0] ?? 1;
      expect(frame.output.values).toBe(changed.probabilities);
      expect(frame.componentLabel).toBe(`ID ${tokenId}の確率`);
      expect(inputValues(frame, "温度 T")[0]).toBe(temperature);
      expect(Math.max(...exponents)).toBe(1);
      expect((exponents[tokenId] ?? 0) / denominator).toBe(frame.result);
    }
  }
);

it("抽選区間の幅は確率と一致し、選択IDを文字片の復元と次のID列へ保持する", () => {
  const selected = localFrame("selection", 1);
  const intervals = selected.matrices[0]?.rows ?? [];
  for (const [tokenId, bounds] of intervals.entries()) {
    expect((bounds[1] ?? 0) - (bounds[0] ?? 0)).toBeCloseTo(
      trace.probabilities[tokenId] ?? 0,
      14
    );
  }
  expect(inputValues(selected, "選択したIDの区間")).toStrictEqual([
    selection.intervalStart,
    selection.intervalEnd,
  ]);
  expect(selected.output.values).toStrictEqual([selection.id]);
  const decoded = localFrame("decode", 1);
  expect(decoded.output.values).toStrictEqual([selection.id]);
  expect(decoded.resultText).toBe(`「${selection.piece}」`);
  const returned = localFrame("return", 1);
  expect(returned.output.values).toStrictEqual([...trace.ids, selection.id]);
  expect(returned.explanation).toContain("まだ実行していない");
  expect(trace.ids).toStrictEqual(DEFAULT_FLOW_IDS);
});

it("終了IDは文字列へ復元せず、生成終了と表示する", () => {
  const end = chooseGeneration(trace, 1 - Number.EPSILON);
  const decoded = computationFrame(trace, end, "decode", 1);
  expect(decoded.resultText).toBe("生成終了");
  expect(decoded.output.values).toStrictEqual([7]);
  const returned = computationFrame(trace, end, "return", 1);
  expect(returned.explanation).toContain("次の予測は実行しない");
});
