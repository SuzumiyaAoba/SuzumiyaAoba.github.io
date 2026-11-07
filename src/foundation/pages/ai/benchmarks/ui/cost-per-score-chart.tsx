/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- 横スクロール領域をキーボードでも操作できるようにする。 */
/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG グラフには図形要素を含めるため、img 要素で代替できない。 */
import { useId, useMemo } from "react";
import type { Benchmark, BenchmarkResult } from "../model/schema";
import type { CostMetric } from "../model/comparison";
import {
  costLabels,
  formatCostPerScore,
  getCostPerScorePoints,
} from "../model/comparison";
import { scoreUnitLabel } from "../model/score";

const chartWidth = 1120;
const plotLeft = 390;
const plotWidth = 560;
const plotTop = 34;
const rowHeight = 32;
const chartBottom = 52;

export function CostPerScoreChart({
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
  const points = useMemo(
    () =>
      getCostPerScorePoints(results, metric).toSorted(
        (a, b) =>
          a.costPerScore - b.costPerScore ||
          b.result.score - a.result.score ||
          a.result.model.localeCompare(b.result.model)
      ),
    [results, metric]
  );

  if (points.length === 0) {
    return (
      <section className="space-y-3" aria-labelledby={titleId}>
        <h3 id={titleId} className="font-medium">
          スコアあたりの費用
        </h3>
        <p className="border-y py-8 text-sm text-muted-foreground">
          正のスコアと公表費用を持つモデルがありません。
        </p>
      </section>
    );
  }

  const maximum = Math.max(...points.map(({ costPerScore }) => costPerScore));
  const scaleMaximum = maximum > 0 ? maximum : 1;
  const height = plotTop + points.length * rowHeight + chartBottom;
  const ticks = [0, scaleMaximum / 2, scaleMaximum];
  const excludedCount = results.length - points.length;
  const unitLabel = scoreUnitLabel(benchmark.scoreType);

  return (
    <figure className="space-y-3" aria-labelledby={titleId}>
      <div className="space-y-1">
        <h3 id={titleId} className="font-medium">
          スコアあたりの費用
        </h3>
        <p
          id={descriptionId}
          className="text-xs leading-relaxed text-muted-foreground"
        >
          {points.length}件を表示。{costLabels[metric]}をスコアで割った値です。
          低いほど、スコア1単位あたりの費用が低くなります。
          {excludedCount > 0
            ? ` スコアが0以下、または費用未公表のため対象外: ${excludedCount}件。`
            : ""}
        </p>
      </div>
      <section
        aria-label="スコアあたりの費用のグラフ（横スクロール可能）"
        tabIndex={0}
        className="overflow-x-auto border bg-surface/30 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full min-w-240 font-mono text-xs"
          role="img"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          <text x={plotLeft} y={16} className="fill-muted-foreground">
            USD / {unitLabel} →
          </text>
          {ticks.map((tick) => {
            const x = plotLeft + plotWidth * (tick / scaleMaximum);
            return (
              <g key={tick}>
                <line
                  x1={x}
                  x2={x}
                  y1={plotTop}
                  y2={plotTop + points.length * rowHeight}
                  className="stroke-border"
                />
                <text
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                >
                  {formatCostPerScore(tick)}
                </text>
              </g>
            );
          })}
          {points.map(({ result, costPerScore }, index) => {
            const y = plotTop + index * rowHeight;
            const barWidth = plotWidth * (costPerScore / scaleMaximum);
            return (
              <g key={result.id}>
                <title>
                  {`${result.model} · ${result.provider} · ${formatCostPerScore(costPerScore)} / ${unitLabel}`}
                </title>
                <text
                  x={plotLeft - 16}
                  y={y + 20}
                  textAnchor="end"
                  className="fill-foreground font-sans"
                >
                  {result.model}
                </text>
                <rect
                  x={plotLeft}
                  y={y + 8}
                  width={costPerScore > 0 ? Math.max(1, barWidth) : 0}
                  height={16}
                  rx={2}
                  className="fill-ai-accent"
                />
                <text
                  x={plotLeft + barWidth + 8}
                  y={y + 20}
                  className="fill-foreground"
                >
                  {formatCostPerScore(costPerScore)}
                </text>
              </g>
            );
          })}
        </svg>
      </section>
    </figure>
  );
}
