import { describe, expect, it } from "vite-plus/test";
import type { BenchmarkResult } from "./schema";
import {
  compareResults,
  defaultCostMetric,
  formatCost,
  getCostPoints,
  getResultCost,
} from "./comparison";
import { createCostChartLayout, createCostScale } from "./chart";

const firstResult: BenchmarkResult = {
  id: "a",
  model: "Alpha",
  provider: "Lab A",
  modelUrl: "https://example.com/a",
  score: 90,
  costPerTaskUsd: null,
  inputPerMillionUsd: 1,
  outputPerMillionUsd: 2,
  harness: null,
  effort: null,
};
const results: BenchmarkResult[] = [
  firstResult,
  {
    id: "b",
    model: "Beta",
    provider: "Lab B",
    modelUrl: "https://example.com/b",
    score: 80,
    costPerTaskUsd: 0.5,
    inputPerMillionUsd: 0.1,
    outputPerMillionUsd: 0.2,
    harness: "Agent",
    effort: "max",
  },
  {
    id: "c",
    model: "Gamma",
    provider: "Lab A",
    modelUrl: "https://example.com/c",
    score: 0,
    costPerTaskUsd: 0,
    inputPerMillionUsd: null,
    outputPerMillionUsd: null,
    harness: null,
    effort: "high",
  },
];

describe("ベンチマークの比較", () => {
  it("実行費用と API の入力・出力単価を区別する", () => {
    expect(getResultCost(firstResult, "task")).toBeNull();
    expect(getResultCost(firstResult, "input")).toBe(1);
    expect(getResultCost(firstResult, "output")).toBe(2);
    expect(defaultCostMetric(results)).toBe("task");
    expect(defaultCostMetric([firstResult])).toBe("output");
  });

  it("費用順では0を有効な値として扱い、未公表を最後に並べる", () => {
    expect(
      compareResults(results, {
        query: "",
        provider: "",
        sort: "cost",
        metric: "task",
      }).map((result) => result.id)
    ).toStrictEqual(["c", "b", "a"]);
    expect(
      compareResults(results, {
        query: "",
        provider: "",
        sort: "cost",
        metric: "output",
      }).map((result) => result.id)
    ).toStrictEqual(["b", "a", "c"]);
    expect(results.map((result) => result.id)).toStrictEqual(["a", "b", "c"]);
  });

  it("開発元と大文字小文字・前後空白を無視した検索を併用する", () => {
    expect(
      compareResults(results, {
        query: " ALPHA ",
        provider: "Lab A",
        sort: "score",
        metric: "task",
      }).map((result) => result.id)
    ).toStrictEqual(["a"]);
    expect(
      compareResults(results, {
        query: "Alpha",
        provider: "Lab B",
        sort: "score",
        metric: "task",
      })
    ).toStrictEqual([]);
    expect(
      compareResults(results, {
        query: "",
        provider: "",
        sort: "score",
        metric: "task",
      }).map((result) => result.score)
    ).toStrictEqual([90, 80, 0]);
  });

  it("グラフでは未公表を除外し、0ドルと0点の結果は表示する", () => {
    expect(
      getCostPoints(results, "task").map(({ result, cost }) => [
        result.score,
        cost,
      ])
    ).toStrictEqual([
      [80, 0.5],
      [0, 0],
    ]);
    expect(formatCost(null)).toBe("未公表");
    expect(formatCost(0)).toBe("$0.00");
    expect(formatCost(0.075)).toBe("$0.075");
  });
});

describe("費用グラフの目盛", () => {
  it("費用の桁が違うモデルを対数目盛で比較できる", () => {
    const scale = createCostScale([0.1, 1, 10], true);
    expect(scale.logarithmic).toBe(true);
    expect(scale.position(0.1)).toBe(0);
    expect(scale.position(1)).toBe(0.5);
    expect(scale.position(10)).toBe(1);
  });

  it.each([{ costs: [0] }, { costs: [] }, { costs: [1, 1] }])(
    "同額・0ドル・空のデータでも座標を有限に保つ: $costs",
    ({ costs }) => {
      const scale = createCostScale(costs, true);
      for (const cost of costs) {
        expect(Number.isFinite(scale.position(cost))).toBe(true);
      }
      expect(scale.ticks.length).toBeGreaterThan(1);
    }
  );
});

describe("費用グラフの常時表示ラベル", () => {
  it.each([1, 2, 25, 26])(
    "%i 個の点が同じ座標にあってもラベルを隠さず、重ねず、枠内に配置する",
    (count) => {
      const points = Array.from({ length: count }, (_, index) => ({
        result: { ...firstResult, id: `model-${index}`, score: 100 },
        cost: 1,
      }));
      const layout = createCostChartLayout(points, true);
      expect(new Set(layout.points.map(({ result }) => result.id)).size).toBe(
        count
      );
      for (const side of ["left", "right"]) {
        const labels = layout.points
          .filter((point) => point.side === side)
          .toSorted((a, b) => a.labelY - b.labelY);
        for (const [index, point] of labels.entries()) {
          expect(point.labelY - 16).toBeGreaterThanOrEqual(layout.plot.top);
          expect(point.labelY + 16).toBeLessThanOrEqual(
            layout.plot.top + layout.plot.height
          );
          const previousY = labels[index - 1]?.labelY ?? point.labelY - 32;
          expect(point.labelY - previousY).toBeGreaterThanOrEqual(32);
        }
      }
    }
  );
});
