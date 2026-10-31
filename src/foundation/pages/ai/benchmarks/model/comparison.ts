import type { BenchmarkResult } from "./schema";

export type CostMetric = "task" | "input" | "output";
export type ResultSort = "score" | "cost";

export const costLabels: Record<CostMetric, string> = {
  task: "評価の実行費用（USD / 問）",
  input: "API 入力単価（USD / 100万トークン）",
  output: "API 出力単価（USD / 100万トークン）",
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

export function defaultCostMetric(results: BenchmarkResult[]): CostMetric {
  return results.some((result) => result.costPerTaskUsd !== null)
    ? "task"
    : "output";
}

export function compareResults(
  results: BenchmarkResult[],
  {
    query,
    provider,
    sort,
    metric,
  }: { query: string; provider: string; sort: ResultSort; metric: CostMetric }
): BenchmarkResult[] {
  const search = query.trim().toLocaleLowerCase();
  return results
    .filter(
      (result) =>
        (!provider || result.provider === provider) &&
        `${result.model} ${result.provider}`
          .toLocaleLowerCase()
          .includes(search)
    )
    .toSorted((a, b) => {
      if (sort === "cost") {
        const costA = getResultCost(a, metric);
        const costB = getResultCost(b, metric);
        if (costA === null && costB !== null) {
          return 1;
        }
        if (costB === null && costA !== null) {
          return -1;
        }
        if (costA !== null && costB !== null && costA !== costB) {
          return costA - costB;
        }
      }
      return b.score - a.score || a.model.localeCompare(b.model);
    });
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 4,
});

export function formatCost(value: number | null): string {
  return value === null ? "未公表" : usd.format(value);
}

export function getCostPoints(results: BenchmarkResult[], metric: CostMetric) {
  return results.flatMap((result) => {
    const cost = getResultCost(result, metric);
    return cost === null ? [] : [{ result, cost }];
  });
}
