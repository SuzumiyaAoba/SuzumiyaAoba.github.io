"use client";

import { useCallback, useEffect, useRef } from "react";
import { schemeCategory10 } from "d3-scale-chromatic";
import { scaleBand, scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import { appendChartAxes } from "./chart-axes";
import { stack, stackOrderNone, stackOffsetNone } from "d3-shape";
import type { SheetData, MetricGroup, ChartConfig } from "./types";
import { useChartMetrics } from "./use-chart-metrics";
import { MetricLegend } from "./metric-legend";

type Props = {
  data: SheetData;
  groups?: MetricGroup[];
  config?: ChartConfig;
  excludeHeaders?: string[];
};

export const StackedBarChart: React.FC<Props> = ({ data, groups, config = {}, excludeHeaders }) => {
  const svgRefs = useRef<(SVGSVGElement | null)[]>([]);
  const colors = config.colors || schemeCategory10;

  const { yAxisMin = 0, yAxisMax = 100, yAxisLabel = "%", labelMap } = config;

  const {
    availableMetrics,
    effectiveGroups,
    selectedMetrics,
    getLabel,
    toggleMetric,
    toggleGroup,
  } = useChartMetrics({ data, groups, excludeHeaders, labelMap });

  const renderBarChart = useCallback(
    (svgElement: SVGSVGElement, group: MetricGroup) => {
      const svg = select(svgElement);
      svg.selectAll("*").remove();

      const margin = { top: 20, right: 20, bottom: 60, left: 80 };
      const width = 700 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const g = svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const activeMetrics = group.metrics.filter((m) => selectedMetrics.includes(m));

      if (activeMetrics.length === 0) return;

      const parseData = data.series.map((d) => {
        const yearData: Record<string, number> = { year: Number.parseInt(d.year) };
        activeMetrics.forEach((metric) => {
          yearData[metric] = d.values[metric] ?? 0;
        });
        return yearData;
      });

      if (parseData.length === 0) return;

      const years = parseData.map((d) => d["year"]);

      const x = scaleBand().domain(years.map(String)).range([0, width]).padding(0.3);

      const y = scaleLinear().domain([yAxisMin, yAxisMax]).range([height, 0]);

      const stackGenerator = stack<Record<string, number>>()
        .keys(activeMetrics)
        .order(stackOrderNone)
        .offset(stackOffsetNone);

      const stackedData = stackGenerator(parseData);

      appendChartAxes(g, {
        x,
        y,
        width,
        height,
        yAxisLabel,
        xTickValues: years.filter((_, index) => index % 2 === 0).map(String),
      });

      stackedData.forEach((layer) => {
        const metricIndex = availableMetrics.indexOf(layer.key);
        const colorIndex = metricIndex >= 0 ? metricIndex : 0;
        const barColor = colors[colorIndex % colors.length] ?? "#000";

        g.selectAll(`.bar-${metricIndex}`)
          .data(layer)
          .enter()
          .append("rect")
          .attr("class", `bar-${metricIndex}`)
          .attr("x", (d) => x(String(d.data["year"])) || 0)
          .attr("y", (d) => y(d[1]))
          .attr("height", (d) => y(d[0]) - y(d[1]))
          .attr("width", x.bandwidth())
          .attr("fill", barColor)
          .attr("fill-opacity", 0.7)
          .attr("stroke", barColor)
          .attr("stroke-width", 1);
      });
    },
    [availableMetrics, colors, data.series, selectedMetrics, yAxisLabel, yAxisMax, yAxisMin],
  );

  useEffect(() => {
    effectiveGroups.forEach((group, index) => {
      const svgElement = svgRefs.current[index];
      if (svgElement) {
        renderBarChart(svgElement, group);
      }
    });
  }, [effectiveGroups, renderBarChart]);

  return (
    <div className="my-8 space-y-8">
      <div className="text-center font-bold text-base mb-4">
        {data.metadata.title.replace(/^[0-9]+[\s.、]*/, "")}
      </div>

      {effectiveGroups.map((group, groupIndex) => (
        <div key={group.name || `group-${groupIndex}`}>
          {group.name && (
            <button
              type="button"
              className="text-center font-semibold text-sm mb-2 cursor-pointer hover:text-blue-600 bg-transparent border-none p-0 w-full"
              onClick={() => toggleGroup(group.metrics)}
            >
              {group.name}
            </button>
          )}
          <div className="overflow-x-auto">
            <svg
              ref={(el) => {
                svgRefs.current[groupIndex] = el;
              }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <MetricLegend
              metrics={group.metrics}
              availableMetrics={availableMetrics}
              selectedMetrics={selectedMetrics}
              colors={colors}
              getLabel={getLabel}
              onToggle={toggleMetric}
              colorOpacity={0.7}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
