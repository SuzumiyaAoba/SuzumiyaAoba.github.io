import { describe, expect, it } from "vite-plus/test";
import { createScoreScale, formatScore } from "./score";
import { createCostChartLayout } from "./chart";
import type { BenchmarkResult } from "./schema";

describe("評価ごとのスコアの単位", () => {
  it("百分率、Elo、負の Net Score を元の単位で表示する", () => {
    expect(formatScore(42.4, "percentage")).toBe("42.40%");
    expect(formatScore(1813.57, "elo")).toBe("1813.57 Elo");
    expect(formatScore(-8.266667, "net-score")).toBe("-8.27");
  });

  it("百分率と Net Score はそれぞれの全範囲を表示する", () => {
    const percentage = createScoreScale([42.4], "percentage");
    expect(percentage.position(0)).toBe(0);
    expect(percentage.position(100)).toBe(1);
    const netScore = createScoreScale([-8, 54], "net-score");
    expect(netScore.ticks).toStrictEqual([-100, -50, 0, 50, 100]);
    expect(netScore.position(0)).toBe(0.5);
    expect(netScore.position(-100)).toBe(0);
    expect(netScore.position(100)).toBe(1);
  });

  it.each([
    { scores: [] },
    { scores: [1813.57] },
    { scores: [1813.57, 1813.57] },
    { scores: [833, 1676, 1814] },
  ])("Elo の値を有限な目盛の範囲内に配置する: $scores", ({ scores }) => {
    const scale = createScoreScale(scores, "elo");
    expect(scale.ticks.length).toBeGreaterThan(1);
    for (const score of scores) {
      expect(scale.position(score)).toBeGreaterThanOrEqual(0);
      expect(scale.position(score)).toBeLessThanOrEqual(1);
    }
  });

  it("Elo の点を100点の範囲外に描かず、高得点ほど上に置く", () => {
    const result: BenchmarkResult = {
      id: "alpha",
      model: "Alpha",
      provider: "Lab",
      modelUrl: "https://example.com/alpha",
      score: 1814,
      costPerTaskUsd: 1,
      inputPerMillionUsd: null,
      outputPerMillionUsd: null,
      harness: null,
      effort: null,
    };
    const layout = createCostChartLayout(
      [
        { result, cost: 1 },
        { result: { ...result, id: "beta", score: 833 }, cost: 2 },
      ],
      false,
      "elo"
    );
    const [alpha, beta] = layout.points;
    expect(alpha?.y).toBeLessThan(beta?.y ?? 0);
    for (const point of layout.points) {
      expect(point.y).toBeGreaterThanOrEqual(layout.plot.top);
      expect(point.y).toBeLessThanOrEqual(layout.plot.top + layout.plot.height);
    }
  });
});
