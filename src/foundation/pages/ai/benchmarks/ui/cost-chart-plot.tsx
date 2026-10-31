/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG 内では HTML の button を配置できないため、キーボード操作に対応した g と ARIA を使う。 */
import { cn } from "@/shared/lib/utils";
import type { Benchmark } from "../model/schema";
import type { CostMetric } from "../model/comparison";
import type { CostChartLayout } from "../model/chart";
import { costLabels, formatCost } from "../model/comparison";
import { formatScore } from "../model/score";

const providerColors: Record<string, string> = {
  OpenAI: "fill-provider-openai",
  Anthropic: "fill-provider-anthropic",
  Google: "fill-provider-google",
  DeepSeek: "fill-provider-deepseek",
};

export function CostChartPlot({
  benchmark,
  metric,
  layout,
  titleId,
  descriptionId,
  selectedId,
  onSelect,
}: {
  benchmark: Benchmark;
  metric: CostMetric;
  layout: CostChartLayout;
  titleId: string;
  descriptionId: string;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  const { plot, scale, scoreScale } = layout;
  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className="w-full min-w-240 font-mono text-xs"
      role="group"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      {scoreScale.ticks.map((score) => {
        const y = plot.top + plot.height * (1 - scoreScale.position(score));
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
        {benchmark.scoreLabel} ↑
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
        const labelHitWidth = side === "left" ? labelX - labelHitX + 4 : 232;
        const lineX = labelX + (side === "left" ? 8 : -8);
        const controlOffset = side === "left" ? -28 : 28;
        return (
          <g
            key={result.id}
            role="button"
            tabIndex={0}
            aria-label={`${result.model}、Effort ${result.effort ?? "未公表"}、スコア ${formatScore(result.score, benchmark.scoreType)}、${costLabels[metric]} ${formatCost(cost)}`}
            aria-pressed={selectedId === result.id}
            onPointerEnter={() => onSelect(result.id)}
            onFocus={() => onSelect(result.id)}
            onClick={() => onSelect(result.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(result.id);
              }
            }}
            className="group cursor-pointer outline-none"
          >
            <title>{`${result.model} · Effort ${result.effort ?? "未公表"} · ${formatScore(result.score, benchmark.scoreType)} · ${formatCost(cost)}`}</title>
            <path
              d={`M ${x} ${y} C ${x + controlOffset} ${y}, ${lineX - controlOffset} ${labelY}, ${lineX} ${labelY}`}
              fill="none"
              className={cn(
                "pointer-events-none",
                selectedId === result.id
                  ? "stroke-foreground"
                  : "stroke-muted-foreground/25"
              )}
              aria-hidden="true"
            />
            <g transform={`translate(${x}, ${y})`}>
              <circle r={13} className="fill-transparent" />
              <circle
                data-model-point={result.id}
                r={selectedId === result.id ? 8 : 6}
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
  );
}

export function CostChartLegend() {
  return (
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
  );
}
