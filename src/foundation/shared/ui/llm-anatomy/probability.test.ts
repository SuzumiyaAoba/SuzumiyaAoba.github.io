import { expect, it } from "vite-plus/test";
import { sampleIndex, softmax } from "./probability";

it("記事の4候補の確率を計算し、合計を1にする", () => {
  const probabilities = softmax([3, 2, 1, 0]);
  expect(probabilities[0]).toBeCloseTo(0.6439142599, 9);
  expect(probabilities[1]).toBeCloseTo(0.2368828181, 9);
  expect(probabilities.reduce((sum, value) => sum + value, 0)).toBeCloseTo(
    1,
    14
  );
});

it("大きな共通の点数を足しても、確率と数値の安定性を保つ", () => {
  const expected = softmax([3, 2, 1, 0]);
  const shifted = softmax([10_003, 10_002, 10_001, 10_000]);
  for (const [index, probability] of shifted.entries()) {
    expect(probability).toBeCloseTo(expected[index] ?? 0, 14);
  }
});

it("未来を負の無限大で隠すと重みは厳密に0になり、残りで正規化する", () => {
  const probabilities = softmax([
    0.2,
    0.3,
    1.1,
    -Infinity,
    -Infinity,
    -Infinity,
  ]);
  expect(probabilities.slice(3)).toStrictEqual([0, 0, 0]);
  expect(
    probabilities.slice(0, 3).reduce((sum, value) => sum + value, 0)
  ).toBeCloseTo(1, 14);
  expect(softmax([0.2, -Infinity])).toStrictEqual([1, 0]);
});

it("温度は順位を保ちながら、低いほど先頭候補へ確率を集中させる", () => {
  const cold = softmax([3, 2, 1, 0], 0.5);
  const normal = softmax([3, 2, 1, 0]);
  const hot = softmax([3, 2, 1, 0], 2);
  expect(cold[0]).toBeGreaterThan(normal[0] ?? 0);
  expect(normal[0]).toBeGreaterThan(hot[0] ?? 0);
  expect(hot[0]).toBeGreaterThan(hot[1] ?? 0);
  expect(sampleIndex(cold, 0.75)).toBe(0);
  expect(sampleIndex(normal, 0.75)).toBe(1);
  expect(sampleIndex(hot, 0.75)).toBe(2);
});

it.each([0, -1, Infinity, Number.NaN])(
  "定義できない温度 %s は受け付けない",
  (temperature) => {
    expect(() => softmax([1, 2], temperature)).toThrow("温度");
  }
);

it("参照可能な候補がない場合や、不正な点数を検出する", () => {
  expect(() => softmax([-Infinity, -Infinity])).toThrow("参照できる候補");
  expect(() => softmax([])).toThrow("点数");
  expect(() => softmax([Number.NaN])).toThrow("点数");
  expect(() => softmax([Infinity])).toThrow("点数");
});

it("くじを累積確率の半開区間に割り当て、確率0の候補を選ばない", () => {
  const probabilities = [0, 0.5, 0.3, 0.2];
  expect(sampleIndex(probabilities, 0)).toBe(1);
  expect(sampleIndex(probabilities, 0.499)).toBe(1);
  expect(sampleIndex(probabilities, 0.5)).toBe(2);
  expect(sampleIndex(probabilities, 0.8)).toBe(3);
  expect(sampleIndex(probabilities, 0.999)).toBe(3);
  expect(sampleIndex([1, 0], 0.999)).toBe(0);
});

it("累積確率の丸め誤差があっても最後の正の確率の候補へ割り当てる", () => {
  expect(
    sampleIndex([0.1, 0.2, 0.6999999999999998, 0], 0.9999999999999999)
  ).toBe(2);
});

it.each([-0.1, 1, Number.NaN, Infinity])(
  "区間外のくじ %s は受け付けない",
  (draw) => {
    expect(() => sampleIndex([0.5, 0.5], draw)).toThrow("くじの位置");
  }
);
