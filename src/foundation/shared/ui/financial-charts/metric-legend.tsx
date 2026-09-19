"use client";

type MetricLegendProps = {
  metrics: string[];
  availableMetrics: string[];
  selectedMetrics: string[];
  colors: readonly string[];
  getLabel: (metric: string) => string;
  onToggle: (metric: string) => void;
  colorOpacity?: number;
};

export function MetricLegend({
  metrics,
  availableMetrics,
  selectedMetrics,
  colors,
  getLabel,
  onToggle,
  colorOpacity,
}: MetricLegendProps) {
  const selectedSet = new Set(selectedMetrics);
  return metrics.map((metric) => {
    const index = availableMetrics.indexOf(metric);
    const isActive = selectedSet.has(metric);
    return (
      <button
        key={metric}
        type="button"
        aria-pressed={isActive}
        onClick={() => onToggle(metric)}
        className="flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 opacity-30 aria-pressed:opacity-100"
      >
        <div
          className="h-4 w-4 bg-(--legend-color) opacity-(--legend-opacity)"
          style={{
            "--legend-color": colors[index % colors.length] ?? "currentColor",
            "--legend-opacity": colorOpacity ?? 1,
          }}
        />
        <span className="text-sm">{getLabel(metric)}</span>
      </button>
    );
  });
}
