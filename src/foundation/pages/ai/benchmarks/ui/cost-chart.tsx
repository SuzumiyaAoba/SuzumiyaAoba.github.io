/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG 内では HTML の button・fieldset を配置できないため、キーボード操作に対応した g と ARIA を使う。 */
/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- 横スクロール領域をキーボードでも操作できるよう、section にフォーカスを当てる。 */
import { useId, useState } from "react";
import { cn } from "@/shared/lib/utils";
import type { BenchmarkResult } from "../model/schema";
import type { CostMetric } from "../model/comparison";
import { costLabels, formatCost, getCostPoints } from "../model/comparison";
import { createCostChartLayout } from "../model/chart";

const scoreTicks = [0, 25, 50, 75, 100];
const providerColors: Record<string, string> = {
  OpenAI: "fill-provider-openai",
  Anthropic: "fill-provider-anthropic",
  Google: "fill-provider-google",
  DeepSeek: "fill-provider-deepseek",
};

export function CostChart({
  results,
  metric,
}: {
  results: BenchmarkResult[];
  metric: CostMetric;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [logarithmic, setLogarithmic] = useState(false);
  const points = getCostPoints(results, metric);
  const selected =
    points.find(({ result }) => result.id === highlightedId) ?? points[0];
  const layout = createCostChartLayout(points, logarithmic);
  const { plot, scale } = layout;
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
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="w-full min-w-240 font-mono text-xs"
          role="group"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          {scoreTicks.map((score) => {
            const y = plot.top + plot.height * (1 - score / 100);
            return (
              <g key={score}>
                <line
                  x1={plot.left}
                  x2={plot.left + plot.width}
                  y1={y}
                  y2={y}
                  className="stroke-border"
                />
                <text
                  x={plot.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground"
                >
                  {score}
                </text>
              </g>
            );
          })}
          {scale.ticks.map((cost) => {
            const x = plot.left + plot.width * scale.position(cost);
            return (
              <g key={cost}>
                <line
                  x1={x}
                  x2={x}
                  y1={plot.top}
                  y2={plot.top + plot.height}
                  className="stroke-border"
                />
                <text
                  x={x}
                  y={plot.top + plot.height + 24}
                  textAnchor="middle"
                  className="fill-muted-foreground"
                >
                  {formatCost(cost)}
                </text>
              </g>
            );
          })}
          <text x={plot.left} y={16} className="fill-muted-foreground">
            スコア（%）↑
          </text>
          <text
            x={plot.left + plot.width / 2}
            y={layout.height - 16}
            textAnchor="middle"
            className="fill-muted-foreground"
          >
            {costLabels[metric]} →
          </text>
          {layout.points.map(({ result, cost, x, y, side, labelY }) => {
            const labelX =
              side === "left" ? plot.left - 48 : plot.left + plot.width + 24;
            const labelHitX = side === "left" ? 8 : labelX - 4;
            const labelHitWidth =
              side === "left" ? labelX - labelHitX + 4 : 232;
            const lineX = labelX + (side === "left" ? 8 : -8);
            const controlOffset = side === "left" ? -28 : 28;
            return (
              <g
                key={result.id}
                role="button"
                tabIndex={0}
                aria-label={`${result.model}、Effort ${result.effort ?? "未公表"}、スコア ${result.score.toFixed(2)}%、${costLabels[metric]} ${formatCost(cost)}`}
                aria-pressed={selected?.result.id === result.id}
                onPointerEnter={() => setHighlightedId(result.id)}
                onFocus={() => setHighlightedId(result.id)}
                onClick={() => setHighlightedId(result.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setHighlightedId(result.id);
                  }
                }}
                className="group cursor-pointer outline-none"
              >
                <title>{`${result.model} · Effort ${result.effort ?? "未公表"} · ${result.score.toFixed(2)}% · ${formatCost(cost)}`}</title>
                <path
                  d={`M ${x} ${y} C ${x + controlOffset} ${y}, ${lineX - controlOffset} ${labelY}, ${lineX} ${labelY}`}
                  fill="none"
                  className={cn(
                    "pointer-events-none",
                    selected?.result.id === result.id
                      ? "stroke-foreground"
                      : "stroke-muted-foreground/25"
                  )}
                  aria-hidden="true"
                />
                <g transform={`translate(${x}, ${y})`}>
                  <circle r={13} className="fill-transparent" />
                  <circle
                    data-model-point={result.id}
                    r={selected?.result.id === result.id ? 8 : 6}
                    className={cn(
                      "stroke-background stroke-2 group-focus-visible:stroke-foreground",
                      providerColors[result.provider] ?? "fill-provider-other"
                    )}
                  />
                </g>
                <rect
                  x={labelHitX}
                  y={labelY - 18}
                  width={labelHitWidth}
                  height={32}
                  rx={2}
                  className="fill-transparent group-focus-visible:stroke-ring"
                  aria-hidden="true"
                />
                <text
                  data-model-label={result.id}
                  x={labelX}
                  y={labelY - 4}
                  textAnchor={side === "left" ? "end" : "start"}
                  className="fill-foreground font-sans"
                  aria-hidden="true"
                >
                  <tspan x={labelX}>{result.model}</tspan>
                  <tspan
                    x={labelX}
                    dy={15}
                    className="fill-muted-foreground font-mono"
                  >{`Effort: ${result.effort ?? "未公表"}`}</tspan>
                </text>
              </g>
            );
          })}
        </svg>
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
              {selected.result.score.toFixed(2)}%{" "}
              <span className="px-2 text-muted-foreground">/</span>{" "}
              {formatCost(selected.cost)}
            </p>
          </>
        )}
      </figcaption>
      <ul
        className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"
        aria-label="グラフの凡例"
      >
        {[
          ...Object.entries(providerColors),
          ["その他", "fill-provider-other"],
        ].map(([provider, color]) => (
          <li key={provider} className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden="true">
              <circle cx={5} cy={5} r={5} className={color} />
            </svg>
            {provider}
          </li>
        ))}
      </ul>
    </figure>
  );
}
