import { Input } from "@/shared/ui/input";
import type { Benchmark, BenchmarkResult } from "../model/schema";
import type { ComparisonOptions, ResultFilters } from "../model/comparison";
import { costLabels, costMetrics, getResultCost } from "../model/comparison";

const controlClass =
  "h-11 w-full min-w-0 rounded-sm border border-input bg-background px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:text-sm";

export function BenchmarkFilters({
  benchmarks,
  benchmarkId,
  providers,
  filters,
  onBenchmarkChange,
  onFiltersChange,
}: {
  benchmarks: Benchmark[];
  benchmarkId: string;
  providers: string[];
  filters: ResultFilters;
  onBenchmarkChange: (id: string) => void;
  onFiltersChange: (filters: ResultFilters) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-2 lg:col-span-1">
        <label htmlFor="benchmark-select" className="text-sm font-medium">
          ベンチマーク
        </label>
        <select
          id="benchmark-select"
          className={controlClass}
          value={benchmarkId}
          onChange={(event) => onBenchmarkChange(event.target.value)}
        >
          {benchmarks.map((benchmark) => (
            <option key={benchmark.id} value={benchmark.id}>
              {benchmark.name}
              {benchmark.archived ? "（更新終了）" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="benchmark-search" className="text-sm font-medium">
          モデルを検索
        </label>
        <Input
          id="benchmark-search"
          type="search"
          placeholder="例: Claude、GPT、DeepSeek"
          value={filters.query}
          onChange={(event) =>
            onFiltersChange({ ...filters, query: event.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="benchmark-provider" className="text-sm font-medium">
          開発元
        </label>
        <select
          id="benchmark-provider"
          className={controlClass}
          value={filters.provider}
          onChange={(event) =>
            onFiltersChange({ ...filters, provider: event.target.value })
          }
        >
          <option value="">すべての開発元</option>
          {providers.map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function ComparisonControls({
  results,
  resultCount,
  options,
  onOptionsChange,
}: {
  results: BenchmarkResult[];
  resultCount: number;
  options: ComparisonOptions;
  onOptionsChange: (options: ComparisonOptions) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="min-w-0 flex-1 basis-64 space-y-2">
        <label htmlFor="benchmark-cost-metric" className="text-sm font-medium">
          費用の比較軸
        </label>
        <select
          id="benchmark-cost-metric"
          className={controlClass}
          value={options.metric}
          onChange={(event) => {
            const metric = costMetrics.find(
              (item) => item === event.target.value
            );
            if (metric) {
              onOptionsChange({ ...options, metric });
            }
          }}
        >
          {costMetrics.map((metric) => (
            <option
              key={metric}
              value={metric}
              disabled={
                !results.some(
                  (result) => getResultCost(result, metric) !== null
                )
              }
            >
              {costLabels[metric]}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0 flex-1 basis-48 space-y-2">
        <label htmlFor="benchmark-sort" className="text-sm font-medium">
          並び順
        </label>
        <select
          id="benchmark-sort"
          className={controlClass}
          value={options.sort}
          onChange={(event) =>
            onOptionsChange({
              ...options,
              sort: event.target.value === "cost" ? "cost" : "score",
            })
          }
        >
          <option value="score">スコアが高い順</option>
          <option value="cost">選択した費用が安い順</option>
        </select>
      </div>
      <output className="py-3 text-xs text-muted-foreground">
        {resultCount} / {results.length} 件
      </output>
    </div>
  );
}
