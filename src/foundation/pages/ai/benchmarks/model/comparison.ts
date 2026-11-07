import type { BenchmarkResult } from "./schema";

export type CostMetric = "task" | "input" | "output";
export type ResultSort = "score" | "cost" | "cost-per-score";
export type ResultFilters = { query: string; provider: string };
export type ComparisonOptions = { sort: ResultSort; metric: CostMetric };

export const costMetrics: readonly CostMetric[] = ["task", "input", "output"];

export const costLabels: Record<CostMetric, string> = {
  task: "評価の実行費用（USD / 問）",
  input: "API 入力単価（USD / 100万トークン）",
  output: "API 出力単価（USD / 100万トークン）",
};

export const costMetricShortLabels: Record<CostMetric, string> = {
  task: "実行費用",
  input: "入力単価",
  output: "出力単価",
};

export function getResultCost(
  result: BenchmarkResult,
  metric: CostMetric
): number | null {
  if (metric === "input") {
    return result.inputPerMillionUsd;
  }
  if (metric === "output") {
    return result.outputPerMillionUsd;
  }
  return result.costPerTaskUsd;
}

export function getCostPerScore(
  result: BenchmarkResult,
  metric: CostMetric
): number | null {
  const cost = getResultCost(result, metric);
  if (cost === null || result.score <= 0) {
    return null;
  }
  const costPerScore = cost / result.score;
  return Number.isFinite(costPerScore) ? costPerScore : null;
}

export function defaultCostMetric(results: BenchmarkResult[]): CostMetric {
  return results.some((result) => result.costPerTaskUsd !== null)
    ? "task"
    : "output";
}

export function createResultFilter({ query, provider }: ResultFilters) {
  const search = query.trim().toLocaleLowerCase();
  return (result: BenchmarkResult) =>
    (!provider || result.provider === provider) &&
    `${result.model} ${result.provider}`.toLocaleLowerCase().includes(search);
}

function compareOptionalCosts(costA: number | null, costB: number | null) {
  if (costA === null) {
    return costB === null ? 0 : 1;
  }
  if (costB === null) {
    return -1;
  }
  return costA - costB;
}

export function compareResults(
  results: BenchmarkResult[],
  { query, provider, sort, metric }: ResultFilters & ComparisonOptions
): BenchmarkResult[] {
  return results
    .filter(createResultFilter({ query, provider }))
    .toSorted((a, b) => {
      const costComparison =
        sort === "cost-per-score"
          ? compareOptionalCosts(
              getCostPerScore(a, metric),
              getCostPerScore(b, metric)
            )
          : sort === "cost"
            ? compareOptionalCosts(
                getResultCost(a, metric),
                getResultCost(b, metric)
              )
            : 0;

      return (
        costComparison || b.score - a.score || a.model.localeCompare(b.model)
      );
    });
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 4,
});

const usdPerScore = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 6,
});

export function formatCost(value: number | null): string {
  return value === null ? "未公表" : usd.format(value);
}

export function formatCostPerScore(value: number): string {
  return usdPerScore.format(value);
}

export function getCostPoints(results: BenchmarkResult[], metric: CostMetric) {
  return results.flatMap((result) => {
    const cost = getResultCost(result, metric);
    return cost === null ? [] : [{ result, cost }];
  });
}

export function getCostPerScorePoints(
  results: BenchmarkResult[],
  metric: CostMetric
) {
  return results.flatMap((result) => {
    const cost = getResultCost(result, metric);
    if (cost === null || result.score <= 0) {
      return [];
    }
    const costPerScore = cost / result.score;
    return Number.isFinite(costPerScore)
      ? [{ result, cost, costPerScore }]
      : [];
  });
}
