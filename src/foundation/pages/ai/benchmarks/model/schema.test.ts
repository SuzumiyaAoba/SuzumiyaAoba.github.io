import { describe, expect, it } from "vite-plus/test";
import rawDataset from "@/content/tools/ai-benchmarks.json";
import { benchmarkDatasetSchema } from "./schema";

describe("公開ベンチマークデータの検証", () => {
  it("掲載する全結果に出典・取得日・評価版があり、数値が有効である", () => {
    const dataset = benchmarkDatasetSchema.parse(rawDataset);
    expect(dataset.benchmarks.length).toBeGreaterThanOrEqual(5);
    for (const benchmark of dataset.benchmarks) {
      expect(Date.parse(benchmark.sourceUpdatedAt)).toBeLessThanOrEqual(
        Date.parse(dataset.retrievedAt)
      );
      expect(benchmark.results.length).toBeGreaterThan(0);
    }
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
