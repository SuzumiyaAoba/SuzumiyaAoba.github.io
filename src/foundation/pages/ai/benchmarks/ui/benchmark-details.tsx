import type { Benchmark } from "../model/schema";
import type { CostMetric } from "../model/comparison";
import { SourceUpdatedAt } from "./source-updated-at";

export function BenchmarkHeader({ benchmark }: { benchmark: Benchmark }) {
  return (
    <header className="space-y-2 border-t pt-5">
      <p className="section-label">{benchmark.category}</p>
      <h2
        id="selected-benchmark"
        className="text-xl font-semibold tracking-tight"
      >
        {benchmark.name}
      </h2>
      <p className="text-sm text-muted-foreground">{benchmark.description}</p>
      <p className="text-xs text-muted-foreground">
        出典:{" "}
        <a href={benchmark.sourceUrl} className="underline underline-offset-4">
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
  );
}

export function BenchmarkCostNotes({
  benchmark,
  metric,
}: {
  benchmark: Benchmark;
  metric: CostMetric;
}) {
  return (
    <>
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
    </>
  );
}
