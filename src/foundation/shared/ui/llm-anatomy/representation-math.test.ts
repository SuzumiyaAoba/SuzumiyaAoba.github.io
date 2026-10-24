import { expect, it } from "vite-plus/test";
import {
  approximateGelu,
  embeddingAt,
  evaluateMlp,
  MLP_W1,
  MLP_W2,
} from "./representation-math";

it("同じトークンは位置が変わっても同じ埋め込み行を参照する", () => {
  const first = embeddingAt(2);
  const repeated = embeddingAt(5);
  expect(first.id).toBe(repeated.id);
  expect(first.vector).toBe(repeated.vector);
  expect(first.positional).not.toStrictEqual(repeated.positional);
  expect(first.hidden).not.toStrictEqual(repeated.hidden);
});

it("埋め込みと位置ベクトルを各成分で加算する", () => {
  const { hidden } = embeddingAt(2);
  for (const [index, expected] of [0.3, 0.6, -0.5, 0.6].entries()) {
    expect(hidden[index]).toBeCloseTo(expected, 12);
  }
  expect(() => embeddingAt(-1)).toThrow("位置");
  expect(() => embeddingAt(6)).toThrow("位置");
});

it("近似GELUは負の入力を一律0にせず、既知の値と一致する", () => {
  expect(approximateGelu(0)).toBe(0);
  expect(approximateGelu(1)).toBeCloseTo(0.841191991, 8);
  expect(approximateGelu(-1)).toBeCloseTo(-0.158808009, 8);
  expect(approximateGelu(3)).toBeCloseTo(2.996362608, 8);
});

it("MLPの行列サイズは2→8→2であり、入力次元の4倍に拡張する", () => {
  expect(MLP_W1).toHaveLength(8);
  expect(MLP_W1.every((row) => row.length === 2)).toBe(true);
  expect(MLP_W2).toHaveLength(2);
  expect(MLP_W2.every((row) => row.length === 8)).toBe(true);
});

it("GELUを省くと二つのアフィン変換はひとつのアフィン変換になる", () => {
  const low = evaluateMlp([-1, 0.5], false).output;
  const high = evaluateMlp([1, 0.5], false).output;
  const middle = evaluateMlp([0, 0.5], false).output;
  for (const [dimension, value] of middle.entries()) {
    expect(value).toBeCloseTo(
      ((low[dimension] ?? 0) + (high[dimension] ?? 0)) / 2,
      12
    );
  }
});

it("GELUを挟むと中点の出力は端点の平均からずれる", () => {
  const low = evaluateMlp([-1, 0.5]).output;
  const high = evaluateMlp([1, 0.5]).output;
  const middle = evaluateMlp([0, 0.5]).output;
  const deviation = Math.abs(
    (middle[0] ?? 0) - ((low[0] ?? 0) + (high[0] ?? 0)) / 2
  );
  expect(deviation).toBeGreaterThan(0.01);
});

it("具体的な入力の前活性とGELU省略時の出力を手計算と照合する", () => {
  const { preactivation, output } = evaluateMlp([1, 0], false);
  for (const [index, value] of [
    1, -0.8, 0.3, -0.4, 0.7, -0.5, 0.6, -0.7,
  ].entries()) {
    expect(preactivation[index]).toBeCloseTo(value, 12);
  }
  expect(output[0]).toBeCloseTo(2.39, 12);
  expect(output[1]).toBeCloseTo(-0.85, 12);
});
