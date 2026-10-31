"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { BenchmarkDataset } from "../model/schema";
import type { CostMetric, ResultSort } from "../model/comparison";
import {
  compareResults,
  costLabels,
  defaultCostMetric,
  getResultCost,
} from "../model/comparison";
import { CostChart } from "./cost-chart";
import { ResultsTable } from "./results-table";
import { ScoresOverview } from "./scores-overview";
import { SourceUpdatedAt } from "./source-updated-at";

const controlClass =
  "h-11 w-full min-w-0 rounded-sm border border-input bg-background px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:text-sm";
const costMetrics: CostMetric[] = ["task", "input", "output"];

export function BenchmarkExplorer({ dataset }: { dataset: BenchmarkDataset }) {
  const [benchmarkId, setBenchmarkId] = useState(
    dataset.benchmarks[0]?.id ?? ""
  );
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("");
  const [sort, setSort] = useState<ResultSort>("score");
  const [metric, setMetric] = useState<CostMetric>("task");
  const benchmark = dataset.benchmarks.find((item) => item.id === benchmarkId);
  const providers = [
    ...new Set(
      dataset.benchmarks.flatMap((item) =>
        item.results.map((result) => result.provider)
      )
    ),
  ].toSorted();

  if (!benchmark) {
    return null;
  }
  const results = compareResults(benchmark.results, {
    query,
    provider,
    sort,
    metric,
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-1">
          <label htmlFor="benchmark-select" className="text-sm font-medium">
            ベンチマーク
          </label>
          <select
            id="benchmark-select"
            className={controlClass}
            value={benchmarkId}
            onChange={(event) => {
              const next = dataset.benchmarks.find(
                (item) => item.id === event.target.value
              );
              if (next) {
                setBenchmarkId(next.id);
                setMetric(defaultCostMetric(next.results));
              }
            }}
          >
            {dataset.benchmarks.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.archived ? "（更新終了）" : ""}
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
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="benchmark-provider" className="text-sm font-medium">
            開発元
          </label>
          <select
            id="benchmark-provider"
            className={controlClass}
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
          >
            <option value="">すべての開発元</option>
            {providers.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="space-y-5" aria-labelledby="selected-benchmark">
        <header className="space-y-2 border-t pt-5">
          <p className="section-label">{benchmark.category}</p>
          <h2
            id="selected-benchmark"
            className="text-xl font-semibold tracking-tight"
          >
            {benchmark.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {benchmark.description}
          </p>
          <p className="text-xs text-muted-foreground">
            出典:{" "}
            <a
              href={benchmark.sourceUrl}
              className="underline underline-offset-4"
            >
              {benchmark.source} ↗
            </a>{" "}
            · 評価版 {benchmark.version} · 出典更新{" "}
            <SourceUpdatedAt value={benchmark.sourceUpdatedAt} />
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {benchmark.methodology}
          </p>
          {benchmark.selection && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              掲載範囲: {benchmark.selection}
            </p>
          )}
          {benchmark.archived && (
            <p className="border-l-2 border-brand pl-3 text-sm text-muted-foreground">
              このベンチマークは評価元で更新が終了しています。新しいモデルの未掲載は低スコアを意味しません。
            </p>
          )}
        </header>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-0 flex-1 basis-64 space-y-2">
            <label
              htmlFor="benchmark-cost-metric"
              className="text-sm font-medium"
            >
              費用の比較軸
            </label>
            <select
              id="benchmark-cost-metric"
              className={controlClass}
              value={metric}
              onChange={(event) => {
                const next = costMetrics.find(
                  (item) => item === event.target.value
                );
                if (next) {
                  setMetric(next);
                }
              }}
            >
              {costMetrics.map((item) => (
                <option
                  key={item}
                  value={item}
                  disabled={
                    !benchmark.results.some(
                      (result) => getResultCost(result, item) !== null
                    )
                  }
                >
                  {costLabels[item]}
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
              value={sort}
              onChange={(event) =>
                setSort(event.target.value === "cost" ? "cost" : "score")
              }
            >
              <option value="score">スコアが高い順</option>
              <option value="cost">選択した費用が安い順</option>
            </select>
          </div>
          <output className="py-3 text-xs text-muted-foreground">
            {results.length} / {benchmark.results.length} 件
          </output>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {metric === "task"
            ? "出典の評価データに基づく1問当たりの費用です。現在の API 料金や実際の入出力量により、請求額は変わります。"
            : "API 単価は100万トークン当たりの料金です。タスク当たりの実行費用とは単位が異なります。入力と出力を分けて比較できます。"}
        </p>
        {benchmark.costMethodology && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {benchmark.costMethodology}{" "}
            {benchmark.costCalculationUrl && (
              <a
                href={benchmark.costCalculationUrl}
                className="underline underline-offset-4"
              >
                評価元の費用計算 ↗
              </a>
            )}
          </p>
        )}
        {results.length === 0 ? (
          <div className="space-y-4 border-y py-10 text-center">
            <p className="text-sm text-muted-foreground">
              条件に一致するモデルがありません。
            </p>
            <Button
              variant="outline"
              size="xl"
              onClick={() => {
                setQuery("");
                setProvider("");
              }}
            >
              絞り込みを解除
            </Button>
          </div>
        ) : (
          <>
            <CostChart
              benchmark={benchmark}
              results={results}
              metric={metric}
            />
            <ResultsTable benchmark={benchmark} results={results} />
          </>
        )}
      </section>
      <ScoresOverview dataset={dataset} query={query} provider={provider} />
    </div>
  );
}
