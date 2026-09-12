"use client";

import { useEffect, useRef } from "react";
import { max } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { schemeCategory10 } from "d3-scale-chromatic";
import { scaleLinear } from "d3-scale";
import { select } from "d3-selection";
import { line } from "d3-shape";
import type { SheetData, MetricGroup, ChartConfig } from "./types";
import { useChartMetrics } from "./use-chart-metrics";
import { MetricLegend } from "./metric-legend";
import { createChartTooltip } from "./chart-tooltip";

type Props = {
  data: SheetData;
  groups?: MetricGroup[];
  config?: ChartConfig;
  excludeHeaders?: string[];
};

export const LineChart: React.FC<Props> = ({ data, groups, config = {}, excludeHeaders }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const colors = config.colors || schemeCategory10;

  const { yAxisMin = 0, yAxisMax = 100, yAxisLabel = "%", startYear = 2006, labelMap } = config;

  const {
    availableMetrics,
    effectiveGroups,
    selectedMetrics,
    getLabel,
    toggleMetric,
    toggleGroup,
  } = useChartMetrics({ data, groups, excludeHeaders, labelMap });

  useEffect(() => {
    if (!svgRef.current || selectedMetrics.length === 0) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 60, left: 80 };
    const width = 700 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    interface ParsedDatum {
      year: number;
      [key: string]: number | null | string;
    }
    const parseData: ParsedDatum[] = data.series
      .filter((d) => selectedMetrics.some((m) => d.values[m] !== null))
      .map((d) => ({
        year: Number.parseInt(d.year),
        ...d.values,
      }));

    if (parseData.length === 0) return;

    const maxYear = max(parseData, (d) => d.year) || 2025;
    const x = scaleLinear().domain([startYear, maxYear]).range([0, width]);

    const y = scaleLinear().domain([yAxisMin, yAxisMax]).range([height, 0]);

    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(
        axisBottom(x)
          .tickSize(-height)
          .tickFormat(() => ""),
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "currentColor").attr("stroke-opacity", 0.1),
      );

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(axisBottom(x).tickFormat((d) => `${d}年`))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    g.append("g")
      .attr("class", "grid")
      .call(
        axisLeft(y)
          .tickSize(-width)
          .tickFormat(() => ""),
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "currentColor").attr("stroke-opacity", 0.1),
      );

    g.append("g").call(axisLeft(y).tickFormat((d) => `${d}${yAxisLabel}`));

    const tooltip = createChartTooltip();
    selectedMetrics.forEach((metric) => {
      const metricIndex = availableMetrics.indexOf(metric);
      const colorIndex = metricIndex >= 0 ? metricIndex : 0;
      const strokeColor = colors[colorIndex % colors.length] ?? "#000";
      const metricData = parseData.filter((d) => d[metric] !== null);

      const lineGenerator = line<(typeof parseData)[0]>()
        .defined((d) => d[metric] !== null)
        .x((d) => x(d.year))
        .y((d) => {
          const val = d[metric];
          return y(typeof val === "number" ? val : 0);
        });

      g.append("path")
        .datum(parseData)
        .attr("fill", "none")
        .attr("stroke", strokeColor)
        .attr("stroke-width", 2)
        .attr("d", lineGenerator);

      metricData.forEach((d) => {
        g.append("circle")
          .attr("cx", x(d.year))
          .attr("cy", () => {
            const val = d[metric];
            return y(typeof val === "number" ? val : 0);
          })
          .attr("r", 4)
          .attr("fill", strokeColor)
          .on("mouseover", function (event) {
            tooltip.show(event, `${d.year}年`, `${getLabel(metric)}: ${d[metric]}${yAxisLabel}`);

            select(this as SVGCircleElement).attr("r", 6);
          })
          .on("mouseout", function () {
            tooltip.hide();
            select(this as SVGCircleElement).attr("r", 4);
          });
      });
    });
    return tooltip.hide;
  }, [
    data,
    selectedMetrics,
    startYear,
    yAxisMin,
    yAxisMax,
    yAxisLabel,
    colors,
    getLabel,
    availableMetrics,
  ]);

  return (
    <div className="my-8">
      <div className="text-center font-bold text-base mb-4">
        {data.metadata.title.replace(/^[0-9]+[\s.、]*/, "")}
      </div>
      <div className="overflow-x-auto">
        <svg ref={svgRef} />
      </div>

      <div className="mt-4 space-y-4">
        {effectiveGroups.map((group) => (
          <div key={group.name || "default"}>
            {group.name && (
              <button
                type="button"
                className="font-semibold text-sm mb-2 cursor-pointer hover:text-blue-600 bg-transparent border-none p-0 text-left"
                onClick={() => toggleGroup(group.metrics)}
              >
                {group.name}
              </button>
            )}
            <div className="flex flex-wrap gap-4">
              <MetricLegend
                metrics={group.metrics}
                availableMetrics={availableMetrics}
                selectedMetrics={selectedMetrics}
                colors={colors}
                getLabel={getLabel}
                onToggle={toggleMetric}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
