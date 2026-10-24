import { expect, it } from "vite-plus/test";
import {
  CINEMA_CHAPTERS,
  CINEMA_DURATION,
  cinemaFrame,
} from "./cinema-timeline";
import { computationFrame } from "./generation-computation-model";
import {
  chooseGeneration,
  DEFAULT_FLOW_IDS,
  runGeneration,
} from "./generation-math";

const trace = runGeneration(DEFAULT_FLOW_IDS);
const selection = chooseGeneration(trace, 0.62);

function chapterStart(id: string): number {
  const chapter = CINEMA_CHAPTERS.find((candidate) => candidate.id === id);
  if (!chapter) {
    throw new Error(`章${id}が必要です。`);
  }
  return chapter.start;
}

it("18章を隙間なく171秒に並べ、開始と完了のフレームを定める", () => {
  expect(CINEMA_CHAPTERS).toHaveLength(18);
  expect(CINEMA_DURATION).toBe(171_000);
  let end = 0;
  for (const [index, chapter] of CINEMA_CHAPTERS.entries()) {
    const { end: chapterEnd } = chapter;
    expect(chapter.start).toBe(end);
    expect(chapter.end - chapter.start).toBe(chapter.duration);
    expect(cinemaFrame(chapter.start).id).toBe(chapter.id);
    expect(cinemaFrame(chapter.start).chapterIndex).toBe(index);
    expect(cinemaFrame(chapter.start).chapterProgress).toBe(0);
    end = chapterEnd;
  }
  expect(end).toBe(CINEMA_DURATION);
  const completed = cinemaFrame(CINEMA_DURATION);
  expect(completed.id).toBe("decode-return");
  expect(completed.operationId).toBe("return");
  expect(completed.chapterProgress).toBe(1);
  expect(completed.operationProgress).toBe(1);
  expect(completed.termProgress).toBe(1);
  expect(completed.stage).toBe("return");
  expect(completed.progress).toBe(1);
});

it.each([
  ["embedding", 4000, "embedding-lookup", "embedding-add"],
  ["qkv", 4000, "qkv-query", "qkv-key"],
  ["qkv", 8000, "qkv-key", "qkv-value"],
  ["score-mask", 6000, "score-mask-score", "score-mask-mask"],
  ["weighted", 5000, "weighted-head-1", "weighted-head-2"],
  ["decode-return", 6000, "decode", "return"],
] as const)(
  "%sの%dmsで小演算を切り替え、積の飛行と途中和を0に戻す",
  (chapter, offset, previousId, nextId) => {
    const boundary = chapterStart(chapter) + offset;
    const before = cinemaFrame(boundary - 0.001);
    const after = cinemaFrame(boundary);
    expect(before.operationId).toBe(previousId);
    expect(before.termProgress).toBeGreaterThan(0.999);
    expect(after.operationId).toBe(nextId);
    expect(after.operationProgress).toBeCloseTo(0, 12);
    expect(after.termProgress).toBeCloseTo(0, 12);
  }
);

it("時間とともに章進捗が連続し、小演算内では代表値を固定して積の進捗だけを進める", () => {
  const frames = Array.from({ length: 1711 }, (_, index) =>
    cinemaFrame(index * 100)
  );
  const byOperation = new Map<string, typeof frames>();
  for (const [index, frame] of frames.entries()) {
    const group = byOperation.get(frame.operationId) ?? [];
    group.push(frame);
    byOperation.set(frame.operationId, group);
    const chapter = CINEMA_CHAPTERS[frame.chapterIndex];
    expect(
      (chapter?.start ?? 0) + (chapter?.duration ?? 0) * frame.chapterProgress
    ).toBeCloseTo(index * 100, 7);
    expect(frame.operationProgress).toBeGreaterThanOrEqual(0);
    expect(frame.operationProgress).toBeLessThanOrEqual(1);
  }
  for (const group of byOperation.values()) {
    const progress = group.map((frame) => frame.termProgress);
    expect(progress).toStrictEqual(
      [...progress].toSorted((left, right) => left - right)
    );
  }
  const fixedGroups = [...byOperation.values()].filter(
    (group) => group[0]?.operationId !== "return"
  );
  for (const group of fixedGroups) {
    expect(new Set(group.map((frame) => frame.stage)).size).toBe(1);
    expect(new Set(group.map((frame) => frame.progress)).size).toBe(1);
  }
});

it.each([
  ["tokenize", 3500, "input", 2, trace.ids],
  ["embedding", 2000, "embedding", 2, trace.input.at(-1)],
  ["embedding", 7000, "embedding", 2, trace.input.at(-1)],
  ["ln1", 4000, "attention", 2, trace.ln1.at(-1)],
  ["qkv", 2000, "attention", 0, trace.heads[0]?.queries.at(-1)],
  ["qkv", 6000, "attention", 0, trace.heads[0]?.keys[1]],
  ["qkv", 10_000, "attention", 0, trace.heads[0]?.values[1]],
  ["score-mask", 3000, "attention", 1, trace.heads[0]?.rawScores.at(-1)],
  ["score-mask", 9000, "attention", 1, trace.heads[0]?.weights.at(-1)],
  ["weighted", 2500, "attention", 0, trace.heads[0]?.outputs.at(-1)],
  ["weighted", 7500, "attention", 0, trace.heads[1]?.outputs.at(-1)],
  ["attention-output", 4000, "attention", 2, trace.attention.at(-1)],
  ["residual1", 4000, "attention-add", 2, trace.afterAttention.at(-1)],
  ["ln2", 4000, "mlp", 2, trace.ln2.at(-1)],
  ["expand", 5000, "mlp", 0, trace.mlpPre.at(-1)],
  ["gelu", 5000, "mlp", 0, trace.mlpActivated.at(-1)],
  ["contract", 6000, "mlp", 2, trace.mlpOutput.at(-1)],
  ["residual2", 4000, "mlp-add", 2, trace.afterMlp.at(-1)],
  ["finalnorm", 4000, "final-norm", 2, trace.lastHidden],
  ["logits", 5000, "output", 2, trace.logits],
  ["softmax", 5000, "probabilities", 2, trace.probabilities],
] as const)(
  "%sの%dmsは狙った実演算・代表成分のtraceを参照する",
  (chapter, offset, nodeId, component, values) => {
    const frame = cinemaFrame(chapterStart(chapter) + offset);
    const calculation = computationFrame(
      trace,
      selection,
      frame.stage,
      frame.progress
    );
    expect(calculation.nodeId).toBe(nodeId);
    expect(calculation.activeComponent).toBe(component);
    expect(calculation.output.values).toBe(values);
  }
);

it("IDで表を引く4秒と位置情報を足す6秒を分離する", () => {
  const start = chapterStart("embedding");
  expect(cinemaFrame(start + 3999).kind).toBe("lookup");
  expect(cinemaFrame(start + 4000).kind).toBe("add");
  expect(cinemaFrame(start + 7000).operationProgress).toBeCloseTo(0.5, 14);
});

it("各小演算の最後20%は全項の合計が完成した状態を保持する", () => {
  const start = chapterStart("contract");
  const accumulating = cinemaFrame(start + 4800);
  expect(accumulating.operationProgress).toBe(0.4);
  expect(accumulating.termProgress).toBe(0.5);
  const completed = cinemaFrame(start + 9600);
  const holding = cinemaFrame(start + 11_400);
  expect(completed.operationProgress).toBe(0.8);
  expect(completed.termProgress).toBe(1);
  expect(holding.operationProgress).toBe(0.95);
  expect(holding.termProgress).toBe(1);
  expect(holding.operationId).toBe(completed.operationId);
  expect(holding.progress).toBe(completed.progress);
});

it("復元した同じ整数IDを保持し、追記段階だけ経路進捗を0から1へ連続的に進める", () => {
  const start = chapterStart("decode-return");
  const decodedFrame = cinemaFrame(start + 3000);
  const decoded = computationFrame(
    trace,
    selection,
    decodedFrame.stage,
    decodedFrame.progress
  );
  expect(decodedFrame.stage).toBe("decode");
  expect(decoded.output.values).toStrictEqual([selection.id]);
  expect(decoded.resultText).toBe(`「${selection.piece}」`);
  const progress = [
    [0, 0],
    [0.25, 0.3125],
    [0.5, 0.625],
    [0.75, 0.9375],
    [1, 1],
  ] as const;
  for (const [fraction, termProgress] of progress) {
    const frame = cinemaFrame(start + 6000 + 6000 * fraction);
    const output = computationFrame(
      trace,
      selection,
      frame.stage,
      frame.progress
    );
    expect(frame.stage).toBe("return");
    expect(frame.progress).toBe(fraction);
    expect(frame.termProgress).toBe(termProgress);
    expect(output.output.values).toStrictEqual([...trace.ids, selection.id]);
  }
  expect(trace.ids).toStrictEqual(DEFAULT_FLOW_IDS);
});

it("範囲外の時刻を開始または完了へ収め、NaNを開始へ戻す", () => {
  expect(cinemaFrame(-1)).toStrictEqual(cinemaFrame(0));
  expect(cinemaFrame(-Infinity)).toStrictEqual(cinemaFrame(0));
  expect(cinemaFrame(Number.NaN)).toStrictEqual(cinemaFrame(0));
  expect(cinemaFrame(CINEMA_DURATION + 1000)).toStrictEqual(
    cinemaFrame(CINEMA_DURATION)
  );
  expect(cinemaFrame(Infinity)).toStrictEqual(cinemaFrame(CINEMA_DURATION));
});
