import { expect, it } from "vite-plus/test";
import {
  ATTENTION_TOKENS,
  calculateAttentionMatrix,
  calculateAttentionRow,
  dotProduct,
} from "./attention-math";
import type { AttentionToken } from "./attention-math";

const EXAMPLE_TOKENS: readonly AttentionToken[] = [
  { id: "a", label: "A", query: [2, 0], key: [1, 0], value: [2, -1] },
  { id: "b", label: "B", query: [0, 2], key: [0, 1], value: [-2, 3] },
];

it("Q と K の各成分を掛けて足し、√d_k で割った点数を使う", () => {
  expect(dotProduct([2, -3], [4, 5])).toBe(-7);
  const row = calculateAttentionRow(EXAMPLE_TOKENS, 0, false);
  expect(row.dotProducts).toStrictEqual([2, 0]);
  expect(row.scaledScores[0]).toBeCloseTo(Math.sqrt(2), 14);
  expect(row.weights[0]).toBeCloseTo(1 / (1 + Math.exp(-Math.sqrt(2))), 14);
});

it("Query を変えると参照範囲だけでなく内積と重みも変わる", () => {
  const first = calculateAttentionRow(EXAMPLE_TOKENS, 0, false);
  const second = calculateAttentionRow(EXAMPLE_TOKENS, 1, false);
  expect(second.query).toStrictEqual([0, 2]);
  expect(second.dotProducts).toStrictEqual([0, 2]);
  expect(first.weights[0]).toBeCloseTo(second.weights[1] ?? 0, 14);
  expect(first.weights[0]).toBeGreaterThan(second.weights[0] ?? 0);
});

it("未来の点数を −∞ に置き換え、自分自身を含めた過去だけで正規化する", () => {
  const rows = calculateAttentionMatrix(ATTENTION_TOKENS, true);
  for (const [queryIndex, row] of rows.entries()) {
    expect(row.weights.reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(
      1,
      14
    );
    expect(row.weights[queryIndex]).toBeGreaterThan(0);
    for (
      let keyIndex = queryIndex + 1;
      keyIndex < ATTENTION_TOKENS.length;
      keyIndex++
    ) {
      expect(row.maskedScores[keyIndex]).toBe(-Infinity);
      expect(row.weights[keyIndex]).toBe(0);
    }
  }
  expect(rows[0]?.weights).toStrictEqual([1, 0, 0, 0, 0, 0]);
  expect(rows[0]?.output).toStrictEqual(ATTENTION_TOKENS[0].value);
});

it("マスクを外すと全位置に正の重みが付き、最後の行の計算は変わらない", () => {
  const masked = calculateAttentionMatrix(ATTENTION_TOKENS, true);
  const unmasked = calculateAttentionMatrix(ATTENTION_TOKENS, false);
  for (const row of unmasked) {
    expect(row.weights.every((weight) => weight > 0)).toBe(true);
    expect(row.weights.reduce((sum, weight) => sum + weight, 0)).toBeCloseTo(
      1,
      14
    );
  }
  expect(masked.at(-1)).toStrictEqual(unmasked.at(-1));
});

it("2 次元の V を各重みで掛けて足し、両成分の出力を求める", () => {
  const row = calculateAttentionRow(EXAMPLE_TOKENS, 0, false);
  const alpha = 1 / (1 + Math.exp(-Math.sqrt(2)));
  expect(row.contributions[0]?.[0]).toBeCloseTo(2 * alpha, 14);
  expect(row.contributions[0]?.[1]).toBeCloseTo(-alpha, 14);
  expect(row.output[0]).toBeCloseTo(2 * alpha - 2 * (1 - alpha), 14);
  expect(row.output[1]).toBeCloseTo(-alpha + 3 * (1 - alpha), 14);
});

it("重み付き平均の各成分は参照できる V の最小値と最大値の範囲に収まる", () => {
  for (const [index, row] of calculateAttentionMatrix(
    ATTENTION_TOKENS,
    true
  ).entries()) {
    for (const dimension of [0, 1] as const) {
      const visibleValues = ATTENTION_TOKENS.slice(0, index + 1).map(
        ({ value }) => value[dimension]
      );
      expect(row.output[dimension]).toBeGreaterThanOrEqual(
        Math.min(...visibleValues)
      );
      expect(row.output[dimension]).toBeLessThanOrEqual(
        Math.max(...visibleValues)
      );
    }
  }
});

it("入力にない Query の位置を受け付けない", () => {
  expect(() => calculateAttentionRow(EXAMPLE_TOKENS, -1, true)).toThrow(
    "Query"
  );
  expect(() => calculateAttentionRow(EXAMPLE_TOKENS, 2, true)).toThrow("Query");
});
