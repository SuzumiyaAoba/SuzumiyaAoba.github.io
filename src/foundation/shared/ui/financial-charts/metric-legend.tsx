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
  return metrics.map((metric) => {
    const index = availableMetrics.indexOf(metric);
    const isActive = selectedMetrics.includes(metric);
    return (
      <button
        key={metric}
        type="button"
        aria-pressed={isActive}
        onClick={() => onToggle(metric)}
        className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
        style={{ opacity: isActive ? 1 : 0.3 }}
      >
        <div
          className="w-4 h-4"
          style={{ backgroundColor: colors[index % colors.length], opacity: colorOpacity }}
        />
        <span className="text-sm">{getLabel(metric)}</span>
      </button>
    );
  });
}
