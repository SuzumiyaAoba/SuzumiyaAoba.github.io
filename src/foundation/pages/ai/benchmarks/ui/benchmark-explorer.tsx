"use client";

import { useMemo, useState } from "react";
import { Button } from "@/shared/ui/button";
import type { BenchmarkDataset } from "../model/schema";
import type { ComparisonOptions, ResultFilters } from "../model/comparison";
import { compareResults, defaultCostMetric } from "../model/comparison";
import { BenchmarkFilters, ComparisonControls } from "./benchmark-controls";
import { BenchmarkCostNotes, BenchmarkHeader } from "./benchmark-details";
import { CostChart } from "./cost-chart";
import { ResultsTable } from "./results-table";
import { ScoresOverview } from "./scores-overview";

export function BenchmarkExplorer({ dataset }: { dataset: BenchmarkDataset }) {
  const [benchmarkId, setBenchmarkId] = useState(
    dataset.benchmarks[0]?.id ?? ""
  );
  const [filters, setFilters] = useState<ResultFilters>({
    query: "",
    provider: "",
  });
  const [options, setOptions] = useState<ComparisonOptions>({
    sort: "score",
    metric: "task",
  });
  const benchmark = dataset.benchmarks.find((item) => item.id === benchmarkId);
  const providers = useMemo(
    () =>
      [
        ...new Set(
          dataset.benchmarks.flatMap((item) =>
            item.results.map((result) => result.provider)
          )
        ),
      ].toSorted(),
    [dataset.benchmarks]
  );

  if (!benchmark) {
    return null;
  }

  const results = compareResults(benchmark.results, { ...filters, ...options });

  function selectBenchmark(id: string) {
    const next = dataset.benchmarks.find((item) => item.id === id);
    if (next) {
      setBenchmarkId(next.id);
      setOptions((current) => ({
        ...current,
        metric: defaultCostMetric(next.results),
      }));
    }
  }

  return (
    <div className="space-y-6">
      <BenchmarkFilters
        benchmarks={dataset.benchmarks}
        benchmarkId={benchmarkId}
        providers={providers}
        filters={filters}
        onBenchmarkChange={selectBenchmark}
        onFiltersChange={setFilters}
      />
      <section className="space-y-5" aria-labelledby="selected-benchmark">
        <BenchmarkHeader benchmark={benchmark} />
        <ComparisonControls
          results={benchmark.results}
          resultCount={results.length}
          options={options}
          onOptionsChange={setOptions}
        />
        <BenchmarkCostNotes benchmark={benchmark} metric={options.metric} />
        {results.length === 0 ? (
          <div className="space-y-4 border-y py-10 text-center">
            <p className="text-sm text-muted-foreground">
              条件に一致するモデルがありません。
            </p>
            <Button
              variant="outline"
              size="xl"
              onClick={() => setFilters({ query: "", provider: "" })}
            >
              絞り込みを解除
            </Button>
          </div>
        ) : (
          <>
            <CostChart
              benchmark={benchmark}
              results={results}
              metric={options.metric}
            />
            <ResultsTable benchmark={benchmark} results={results} />
          </>
        )}
      </section>
      <ScoresOverview dataset={dataset} filters={filters} />
    </div>
  );
}
