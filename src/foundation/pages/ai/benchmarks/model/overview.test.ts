import { describe, expect, it } from "vite-plus/test";
import { createResultFilter } from "./comparison";
import { createScoresOverview } from "./overview";
import {
  alphaResult,
  benchmarkDataset,
  codingBenchmark,
} from "./test-fixtures";

describe("ベンチマーク横断のスコア一覧", () => {
  it("同じモデルの結果を統合し、評価ごとのスコアと推論設定を保持する", () => {
    const { rows } = createScoresOverview(benchmarkDataset.benchmarks);
    expect(rows.map(({ model }) => model.id)).toStrictEqual([
      "alpha",
      "gamma",
      "beta",
    ]);
    const alpha = rows.find(({ model }) => model.id === "alpha");
    expect(alpha?.results.get("coding")).toMatchObject({
      score: 90,
      effort: "high",
    });
    expect(alpha?.results.get("knowledge")).toMatchObject({
      score: 50,
      effort: "max",
    });
    expect(
      rows.find(({ model }) => model.id === "gamma")?.results.has("knowledge")
    ).toBe(false);
    expect(codingBenchmark.results.map(({ id }) => id)).toStrictEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
  });

  it.each([
    {
      scores: [100, 100, 80, 50],
      ranks: [
        [100, 1],
        [80, 3],
        [50, 4],
      ],
    },
    {
      scores: [0, -10, -10, -30],
      ranks: [
        [0, 1],
        [-10, 2],
        [-30, 4],
      ],
    },
    { scores: [90, 90, 90, 90], ranks: [[90, 1]] },
  ])("同点を同順位として次の順位を進める: $scores", ({ scores, ranks }) => {
    const benchmark = {
      ...codingBenchmark,
      results: scores.map((score, index) => ({
        ...alphaResult,
        id: `model-${index}`,
        score,
      })),
    };
    const { ranksByBenchmark } = createScoresOverview([benchmark]);
    expect([...(ranksByBenchmark.get(benchmark.id) ?? [])]).toStrictEqual(
      ranks
    );
  });

  it("検索と開発元で絞り込んでも、各評価の全モデルを基準にした順位を保つ", () => {
    const { rows, ranksByBenchmark } = createScoresOverview(
      benchmarkDataset.benchmarks
    );
    const matches = createResultFilter({ query: " GAMMA ", provider: "Lab A" });
    const filtered = rows.filter(({ model }) => matches(model));
    expect(filtered.map(({ model }) => model.id)).toStrictEqual(["gamma"]);
    expect(ranksByBenchmark.get("coding")?.get(70)).toBe(3);
    expect(ranksByBenchmark.get("knowledge")?.get(50)).toBe(2);
  });
});
