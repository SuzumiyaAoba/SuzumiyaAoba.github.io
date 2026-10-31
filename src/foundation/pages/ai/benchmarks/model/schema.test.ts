import { describe, expect, it } from "vite-plus/test";
import rawDataset from "@/content/tools/ai-benchmarks.json";
import { benchmarkDatasetSchema } from "./schema";

describe("公開ベンチマークデータの検証", () => {
  it("掲載する全結果に出典・取得日・評価版があり、数値が有効である", () => {
    const dataset = benchmarkDatasetSchema.parse(rawDataset);
    expect(dataset.benchmarks).toHaveLength(14);
    for (const benchmark of dataset.benchmarks) {
      expect(benchmark.results.length).toBeGreaterThan(0);
    }
    const publishedDates = dataset.benchmarks.flatMap(({ sourceUpdatedAt }) =>
      sourceUpdatedAt === null ? [] : [sourceUpdatedAt]
    );
    for (const date of publishedDates) {
      expect(Date.parse(date)).toBeLessThanOrEqual(
        Date.parse(dataset.retrievedAt)
      );
    }
  });

  it.each([
    { id: "terminal-bench-4", score: 101, valid: false },
    { id: "terminal-bench-4", score: -1, valid: false },
    { id: "aa-briefcase", score: 1814, valid: true },
    { id: "aa-briefcase", score: -1, valid: false },
    { id: "aa-omniscience", score: -100, valid: true },
    { id: "aa-omniscience", score: 100, valid: true },
    { id: "aa-omniscience", score: -101, valid: false },
    { id: "aa-omniscience", score: 101, valid: false },
  ])("$id のスコア $score の範囲を検証する", ({ id, score, valid }) => {
    const dataset = benchmarkDatasetSchema.parse(rawDataset);
    const result = dataset.benchmarks.find((item) => item.id === id)
      ?.results[0];
    if (!result) {
      throw new Error("Missing fixture");
    }
    result.score = score;
    expect(benchmarkDatasetSchema.safeParse(dataset).success).toBe(valid);
  });

  it("追加評価の出典、難問集合、Fallback の設定を保持する", () => {
    const dataset = benchmarkDatasetSchema.parse(rawDataset);
    const briefcase = dataset.benchmarks.find(
      (item) => item.id === "aa-briefcase"
    );
    const critpt = dataset.benchmarks.find(
      (item) => item.id === "critpt-v2-hard"
    );
    expect(briefcase?.source).toBe("Artificial Analysis");
    expect(briefcase?.sourceUpdatedAt).toBeNull();
    expect(briefcase?.results[0]?.configuration).toBe("Default Fallback");
    expect(critpt?.sourceUrl).toContain("subset=hard");
    expect(
      critpt?.results.find((result) => result.id === "openai_gpt-6-astra")
        ?.score
    ).toBe(70.5);
  });

  it("負の費用・範囲外のスコアを拒否する", () => {
    const dataset = benchmarkDatasetSchema.parse(rawDataset);
    const result = dataset.benchmarks[0]?.results[0];
    if (!result) {
      throw new Error("Missing fixture");
    }
    result.costPerTaskUsd = -1;
    result.score = 101;
    expect(benchmarkDatasetSchema.safeParse(dataset).success).toBe(false);
  });

  it("モデル結果の重複と安全でない出典リンクを拒否する", () => {
    const dataset = benchmarkDatasetSchema.parse(rawDataset);
    const [benchmark] = dataset.benchmarks;
    const result = benchmark?.results[0];
    if (!benchmark || !result) {
      throw new Error("Missing fixture");
    }
    benchmark.results.push(result);
    expect(benchmarkDatasetSchema.safeParse(dataset).success).toBe(false);
    benchmark.results.pop();
    benchmark.sourceUrl = "javascript:alert(1)";
    expect(benchmarkDatasetSchema.safeParse(dataset).success).toBe(false);
  });
});
