import type { Benchmark, BenchmarkResult } from "./schema";

type ModelRow = {
  model: BenchmarkResult;
  results: Map<string, BenchmarkResult>;
};

/** 同点は同順位とし、次の順位は同点の件数だけ進める。 */
function getScoreRanks(results: BenchmarkResult[]) {
  const ranks = new Map<number, number>();
  for (const [index, result] of results
    .toSorted((a, b) => b.score - a.score)
    .entries()) {
    if (!ranks.has(result.score)) {
      ranks.set(result.score, index + 1);
    }
  }
  return ranks;
}

export function createScoresOverview(benchmarks: Benchmark[]) {
  const models = new Map<string, ModelRow>();
  const ranksByBenchmark = new Map<string, Map<number, number>>();

  for (const benchmark of benchmarks) {
    ranksByBenchmark.set(benchmark.id, getScoreRanks(benchmark.results));
    for (const result of benchmark.results) {
      const row = models.get(result.id) ?? {
        model: result,
        results: new Map<string, BenchmarkResult>(),
      };
      row.results.set(benchmark.id, result);
      models.set(result.id, row);
    }
  }

  return {
    rows: [...models.values()].toSorted(
      (a, b) =>
        a.model.provider.localeCompare(b.model.provider) ||
        a.model.model.localeCompare(b.model.model)
    ),
    ranksByBenchmark,
  };
}
