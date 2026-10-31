/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- 横スクロール領域をキーボードでも操作できるよう、section にフォーカスを当てる。 */
import { useId, useMemo, useState } from "react";
import type { Benchmark, BenchmarkResult } from "../model/schema";
import type { CostMetric } from "../model/comparison";
import { formatCost, getCostPoints } from "../model/comparison";
import { createCostChartLayout } from "../model/chart";
import { formatScore } from "../model/score";
import { CostChartLegend, CostChartPlot } from "./cost-chart-plot";

export function CostChart({
  benchmark,
  results,
  metric,
}: {
  benchmark: Benchmark;
  results: BenchmarkResult[];
  metric: CostMetric;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [logarithmic, setLogarithmic] = useState(false);
  const points = useMemo(
    () => getCostPoints(results, metric),
    [results, metric]
  );
  const selected =
    points.find(({ result }) => result.id === highlightedId) ?? points[0];
  const layout = useMemo(
    () => createCostChartLayout(points, logarithmic, benchmark.scoreType),
    [points, logarithmic, benchmark.scoreType]
  );
  const { scale } = layout;
  const unknownCount = results.length - points.length;

  if (points.length === 0) {
    return (
      <p className="border-y py-8 text-sm text-muted-foreground">
        この条件で比較できる費用データはありません。スコアは下の表で確認できます。
      </p>
    );
  }

  return (
    <figure className="space-y-3" aria-labelledby={titleId}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={titleId} className="font-medium">
          費用とスコアの比較
        </h3>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            className="size-4 accent-brand"
            checked={logarithmic}
            onChange={(event) => setLogarithmic(event.target.checked)}
          />
          費用を対数目盛で表示
        </label>
      </div>
      <p
        id={descriptionId}
        className="text-xs leading-relaxed text-muted-foreground"
      >
        左上ほど低費用で高スコア。モデル名と Effort
        を常時表示し、引き出し線で点に結んでいます。点やモデル名に触れると対応する点が強調され、数値も確認できます。狭い画面ではグラフを横スクロールできます。
        {points.length} 件を表示
        {unknownCount > 0
          ? `、費用未公表の ${unknownCount} 件はグラフから除外`
          : ""}
        。
        {logarithmic && !scale.logarithmic
          ? "費用に0が含まれるため線形目盛で表示しています。"
          : ""}
      </p>
      <section
        aria-label="費用とスコアのグラフ（横スクロール可能）"
        tabIndex={0}
        className="overflow-x-auto border bg-surface/30"
      >
        <CostChartPlot
          benchmark={benchmark}
          metric={metric}
          layout={layout}
          titleId={titleId}
          descriptionId={descriptionId}
          selectedId={selected?.result.id}
          onSelect={setHighlightedId}
        />
      </section>
      <figcaption
        className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b pb-4 text-sm"
        aria-live="polite"
        aria-atomic="true"
      >
        {selected && (
          <>
            <div>
              <span className="font-medium">{selected.result.model}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {selected.result.provider}
              </span>
              <span className="ml-2 text-xs text-muted-foreground">
                Effort: {selected.result.effort ?? "未公表"}
              </span>
            </div>
            <p className="font-mono tabular-nums">
              {formatScore(selected.result.score, benchmark.scoreType)}{" "}
              <span className="px-2 text-muted-foreground">/</span>{" "}
              {formatCost(selected.cost)}
            </p>
          </>
        )}
      </figcaption>
      <CostChartLegend />
    </figure>
  );
}
