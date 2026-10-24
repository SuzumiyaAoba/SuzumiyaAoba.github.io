import { expect, it } from "vite-plus/test";
import {
  chooseGeneration,
  decodeFlow,
  DEFAULT_FLOW_IDS,
  FLOW_DIMENSION,
  FLOW_EPSILON,
  FLOW_HEAD_DIMENSION,
  FLOW_MAX_CONTEXT,
  FLOW_VOCABULARY,
  FLOW_WEIGHTS,
  runGeneration,
} from "./generation-math";
import type { FlowMatrix } from "./generation-math";

function expectVectorClose(
  actual: readonly number[],
  expected: readonly number[]
): void {
  expect(actual).toHaveLength(expected.length);
  for (const [index, value] of expected.entries()) {
    expect(actual[index]).toBeCloseTo(value, 13);
  }
}

function expectMatrixClose(actual: FlowMatrix, expected: FlowMatrix): void {
  expect(actual).toHaveLength(expected.length);
  for (const [position, row] of expected.entries()) {
    expectVectorClose(actual[position] ?? [], row);
  }
}

function expectedProjection(
  weights: FlowMatrix,
  input: readonly number[],
  bias: readonly number[] = []
): number[] {
  return weights.map((row, output) => {
    let sum = bias[output] ?? 0;
    for (const [component, weight] of row.entries()) {
      sum += weight * (input[component] ?? 0);
    }
    return sum;
  });
}

function entropy(probabilities: readonly number[]): number {
  return probabilities.reduce((sum, value) => sum - value * Math.log(value), 0);
}

it("8語彙のIDと断片を一対一に対応させ、終端を復元文字列に含めない", () => {
  expect(FLOW_VOCABULARY.map(({ id }) => id)).toStrictEqual([
    0, 1, 2, 3, 4, 5, 6, 7,
  ]);
  expect(new Set(FLOW_VOCABULARY.map(({ piece }) => piece)).size).toBe(8);
  expect(decodeFlow(DEFAULT_FLOW_IDS)).toBe("私は猫");
  expect(decodeFlow([0, 1, 3, 4, 5, 6, 7])).toBe("私は犬が好き。");
  expect(decodeFlow([0, 7, 2])).toBe("私");
  expect(decodeFlow([7])).toBe("");
  expect(decodeFlow([])).toBe("");
});

it("入力IDで埋め込みを引き、位置表を足して4次元の入力を作る", () => {
  const trace = runGeneration(DEFAULT_FLOW_IDS);
  expect(trace.ids).toStrictEqual(DEFAULT_FLOW_IDS);
  expect(trace.ids).not.toBe(DEFAULT_FLOW_IDS);
  expect(trace.e).toStrictEqual(
    DEFAULT_FLOW_IDS.map((id) => FLOW_WEIGHTS.embedding[id])
  );
  expect(trace.p).toStrictEqual(FLOW_WEIGHTS.positional.slice(0, 3));
  expectVectorClose(trace.input[0] ?? [], [0.58, -0.48, 0.16, 0.5]);
  for (const [position, row] of trace.input.entries()) {
    expect(row).toHaveLength(FLOW_DIMENSION);
    for (const [component, value] of row.entries()) {
      expect(value).toBe(
        (trace.e[position]?.[component] ?? 0) +
          (trace.p[position]?.[component] ?? 0)
      );
    }
  }
});

it("LayerNormは位置ごとに4成分の母分散とepsilonを用い、gamma・betaを適用する", () => {
  const trace = runGeneration(DEFAULT_FLOW_IDS);
  expect(trace.ln1Statistics[0]?.mean).toBeCloseTo(0.19, 14);
  expect(trace.ln1Statistics[0]?.variance).toBeCloseTo(0.1745, 14);
  expect(trace.ln1Statistics[0]?.denominator).toBeCloseTo(
    Math.sqrt(0.1745 + FLOW_EPSILON),
    14
  );
  expectVectorClose(
    trace.ln1[0] ?? [],
    [0.39, -0.67, -0.03, 0.31].map(
      (centered, component) =>
        (centered / Math.sqrt(0.1745 + FLOW_EPSILON)) *
          (FLOW_WEIGHTS.ln1.gamma[component] ?? 1) +
        (FLOW_WEIGHTS.ln1.beta[component] ?? 0)
    )
  );
  for (const [input, normalized, parameters] of [
    [trace.afterAttention, trace.ln2, FLOW_WEIGHTS.ln2],
    [trace.afterMlp, trace.normalized, FLOW_WEIGHTS.finalNorm],
  ] as const) {
    for (const [position, row] of input.entries()) {
      const mean = row.reduce((sum, value) => sum + value, 0) / 4;
      const variance =
        row.reduce((sum, value) => sum + (value - mean) ** 2, 0) / 4;
      expectVectorClose(
        normalized[position] ?? [],
        row.map(
          (value, component) =>
            ((value - mean) / Math.sqrt(variance + FLOW_EPSILON)) *
              (parameters.gamma[component] ?? 1) +
            (parameters.beta[component] ?? 0)
        )
      );
    }
  }
});

it("2ヘッドそれぞれでQ・K・Vを投影し、scaled scoreの未来をmaskする", () => {
  const trace = runGeneration(DEFAULT_FLOW_IDS);
  expect(trace.heads).toHaveLength(2);
  for (const [headIndex, head] of trace.heads.entries()) {
    const weights = FLOW_WEIGHTS.heads[headIndex];
    expect(weights).toBeDefined();
    if (weights === undefined) {
      throw new Error("テスト対象のヘッドが必要です。");
    }
    for (const [position, input] of trace.ln1.entries()) {
      expectVectorClose(
        head.queries[position] ?? [],
        expectedProjection(weights.query, input)
      );
      expectVectorClose(
        head.keys[position] ?? [],
        expectedProjection(weights.key, input)
      );
      expectVectorClose(
        head.values[position] ?? [],
        expectedProjection(weights.value, input)
      );
    }
    for (const [target, query] of head.queries.entries()) {
      const probabilities = head.weights[target] ?? [];
      expect(probabilities.reduce((sum, value) => sum + value, 0)).toBeCloseTo(
        1,
        14
      );
      for (const [source, key] of head.keys.entries()) {
        const expectedScore =
          query.reduce(
            (sum, value, component) => sum + value * (key[component] ?? 0),
            0
          ) / Math.sqrt(FLOW_HEAD_DIMENSION);
        expect(head.rawScores[target]?.[source]).toBeCloseTo(expectedScore, 14);
        expect(head.scores[target]?.[source]).toBe(
          source > target ? -Infinity : expectedScore
        );
      }
      expect(probabilities.slice(target + 1)).toStrictEqual(
        Array.from({ length: trace.ids.length - target - 1 }, () => 0)
      );
      expect(
        probabilities.slice(0, target + 1).every((value) => value > 0)
      ).toBe(true);
    }
  }
});

it("参照元ごとの重み付きVを合計し、ヘッド連結後にWoを掛けて残差を足す", () => {
  const trace = runGeneration(DEFAULT_FLOW_IDS);
  expect(trace.concatenated).toHaveLength(DEFAULT_FLOW_IDS.length);
  for (const head of trace.heads) {
    for (const [target, bySource] of head.contributions.entries()) {
      for (const [source, contribution] of bySource.entries()) {
        expectVectorClose(
          contribution,
          (head.values[source] ?? []).map(
            (value) => value * (head.weights[target]?.[source] ?? 0)
          )
        );
      }
      expectVectorClose(
        head.outputs[target] ?? [],
        [0, 1].map((component) =>
          bySource.reduce((sum, value) => sum + (value[component] ?? 0), 0)
        )
      );
    }
  }
  for (const [position, concatenated] of trace.concatenated.entries()) {
    expectVectorClose(
      concatenated,
      trace.heads.flatMap((head) => head.outputs[position] ?? [])
    );
    const attention = expectedProjection(FLOW_WEIGHTS.output, concatenated);
    expectVectorClose(trace.attention[position] ?? [], attention);
    expectVectorClose(
      trace.afterAttention[position] ?? [],
      (trace.input[position] ?? []).map(
        (value, component) => value + (attention[component] ?? 0)
      )
    );
  }
});

it("MLPは各位置で4→16→4を計算し、GELUと2本目の残差を適用する", () => {
  const trace = runGeneration(DEFAULT_FLOW_IDS);
  for (const [position, input] of trace.ln2.entries()) {
    const pre = expectedProjection(
      FLOW_WEIGHTS.mlp.first,
      input,
      FLOW_WEIGHTS.mlp.firstBias
    );
    expect(pre).toHaveLength(16);
    expectVectorClose(trace.mlpPre[position] ?? [], pre);
    const activated = pre.map(
      (value) =>
        0.5 *
        value *
        (1 +
          Math.tanh(Math.sqrt(2 / Math.PI) * (value + 0.044715 * value ** 3)))
    );
    expectVectorClose(trace.mlpActivated[position] ?? [], activated);
    const output = expectedProjection(
      FLOW_WEIGHTS.mlp.second,
      activated,
      FLOW_WEIGHTS.mlp.secondBias
    );
    expect(output).toHaveLength(4);
    expectVectorClose(trace.mlpOutput[position] ?? [], output);
    expectVectorClose(
      trace.afterMlp[position] ?? [],
      (trace.afterAttention[position] ?? []).map(
        (value, component) => value + (output[component] ?? 0)
      )
    );
  }
});

it("最終位置の正規化表現を共有埋め込みで8 logitsへ写し、確率に正規化する", () => {
  const trace = runGeneration(DEFAULT_FLOW_IDS);
  expect(FLOW_WEIGHTS.lmHead).toBe(FLOW_WEIGHTS.embedding);
  expect(trace.lastHidden).toBe(trace.normalized.at(-1));
  expectVectorClose(
    trace.logits,
    expectedProjection(FLOW_WEIGHTS.embedding, trace.lastHidden)
  );
  expect(trace.probabilities).toHaveLength(FLOW_VOCABULARY.length);
  expect(trace.probabilities.every((value) => value > 0 && value < 1)).toBe(
    true
  );
  expect(
    trace.probabilities.reduce((sum, value) => sum + value, 0)
  ).toBeCloseTo(1, 14);
  const denominator = trace.logits.reduce(
    (sum, logit) => sum + Math.exp(logit),
    0
  );
  expectVectorClose(
    trace.probabilities,
    trace.logits.map((logit) => Math.exp(logit) / denominator)
  );
});

it("後ろのIDを変えても前の位置の表現は変わらず、最後の分布は変わる", () => {
  const original = runGeneration(DEFAULT_FLOW_IDS);
  const changed = runGeneration([0, 1, 3]);
  for (const key of [
    "ln1",
    "attention",
    "afterAttention",
    "ln2",
    "mlpPre",
    "mlpActivated",
    "mlpOutput",
    "afterMlp",
    "normalized",
  ] as const) {
    expectMatrixClose(original[key].slice(0, 2), changed[key].slice(0, 2));
  }
  expect(original.probabilities).not.toStrictEqual(changed.probabilities);
});

it.each([
  [3, 1, 2],
  [0, 4, 2],
  [0, 1, 3],
])("入力列 %j への変更が最終位置の確率まで伝わる", (...ids) => {
  const original = runGeneration(DEFAULT_FLOW_IDS);
  const changed = runGeneration(ids);
  expect(
    changed.probabilities.some(
      (value, id) => Math.abs(value - (original.probabilities[id] ?? 0)) > 1e-6
    )
  ).toBe(true);
});

it("温度は確率への写像だけを変え、高い温度は分布のエントロピーを上げる", () => {
  const cold = runGeneration(DEFAULT_FLOW_IDS, 0.5);
  const hot = runGeneration(DEFAULT_FLOW_IDS, 2);
  expect(hot.logits).toStrictEqual(cold.logits);
  expect(hot.afterMlp).toStrictEqual(cold.afterMlp);
  expect(entropy(hot.probabilities)).toBeGreaterThan(
    entropy(cold.probabilities)
  );
});

it("累積確率の半開区間からIDを選び、IDから断片と終端を引く", () => {
  const trace = runGeneration(DEFAULT_FLOW_IDS);
  let start = 0;
  for (const [id, probability] of trace.probabilities.entries()) {
    const selected = chooseGeneration(trace, start + probability / 2);
    expect(selected.id).toBe(id);
    expect(selected.piece).toBe(FLOW_VOCABULARY[id]?.piece);
    expect(selected.probability).toBe(probability);
    expect(selected.intervalStart).toBe(start);
    expect(selected.intervalEnd).toBeCloseTo(start + probability, 14);
    expect(selected.isEnd).toBe(id === 7);
    expect(chooseGeneration(trace, start).id).toBe(id);
    start += probability;
  }
  expect(chooseGeneration(trace, 0).id).toBe(0);
  expect(chooseGeneration(trace, 1 - Number.EPSILON).id).toBe(7);
  expect(chooseGeneration(trace, 1 - Number.EPSILON).intervalEnd).toBe(1);
});

it("選んだIDを追加して再計算し、既存位置の表現を保って新位置を計算する", () => {
  const first = runGeneration(DEFAULT_FLOW_IDS);
  const selected = chooseGeneration(first, 0);
  expect(selected.isEnd).toBe(false);
  const ids = [...first.ids, selected.id];
  const next = runGeneration(ids);
  expect(next.ids).toStrictEqual([0, 1, 2, 0]);
  expect(decodeFlow(next.ids)).toBe("私は猫私");
  expect(next.input).toHaveLength(4);
  expectMatrixClose(next.normalized.slice(0, 3), first.normalized);
  expect(next.probabilities).not.toStrictEqual(first.probabilities);
  expect(
    runGeneration(Array.from({ length: FLOW_MAX_CONTEXT }, () => 0)).ids
  ).toHaveLength(FLOW_MAX_CONTEXT);
});

it.each([
  { ids: [] },
  { ids: Array.from({ length: FLOW_MAX_CONTEXT + 1 }, () => 0) },
])("範囲外の入力長 $ids を拒否する", ({ ids }) => {
  expect(() => runGeneration(ids)).toThrow("入力");
});

it.each([-1, 8, 1.5, Number.NaN, Infinity])(
  "未定義のID %s を拒否する",
  (id) => {
    expect(() => runGeneration([0, 1, id])).toThrow("ID");
    expect(() => decodeFlow([id])).toThrow("ID");
  }
);

it.each([0, -1, Number.NaN, Infinity])(
  "不正な温度 %s を拒否する",
  (temperature) => {
    expect(() => runGeneration(DEFAULT_FLOW_IDS, temperature)).toThrow("温度");
  }
);

it.each([-0.1, 1, Number.NaN, Infinity])(
  "不正なくじの位置 %s を拒否する",
  (draw) => {
    expect(() =>
      chooseGeneration(runGeneration(DEFAULT_FLOW_IDS), draw)
    ).toThrow("くじ");
  }
);
