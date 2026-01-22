"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { SheetData, MetricGroup, ChartConfig } from "./types";

type Props = {
  data: SheetData;
  groups?: MetricGroup[];
  config?: ChartConfig;
  excludeHeaders?: string[];
};

export const LineChart: React.FC<Props> = ({
  data,
  groups = [],
  config = {},
  excludeHeaders = [],
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const colors = config.colors || d3.schemeCategory10;

  const {
    yAxisMin = 0,
    yAxisMax = 100,
    yAxisLabel = "%",
    startYear = 2006,
    labelMap = {},
  } = config;

  // ラベルを取得する関数
  const getLabel = useCallback(
    (metric: string): string => {
      if (labelMap[metric]) {
        return labelMap[metric];
      }
      // デフォルト: パイプ区切りを整形
      const parts = metric
        .split("|")
        .map((p) => p.trim())
        .filter((p) => p && p !== "％");
      return parts.join("");
    },
    [labelMap],
  );

  const availableMetrics = data.headers.filter((header) => {
    return !excludeHeaders.includes(header) && data.series.some((s) => s.values[header] !== null);
  });

  const effectiveGroups = groups.length > 0 ? groups : [{ name: "", metrics: availableMetrics }];

  useEffect(() => {
    if (selectedMetrics.length === 0 && availableMetrics.length > 0) {
      setSelectedMetrics(availableMetrics);
    }
  }, [availableMetrics, selectedMetrics.length]);

  useEffect(() => {
    if (!svgRef.current || selectedMetrics.length === 0) return;

    const svg = d3.select(svgRef.current);
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

    const maxYear = d3.max(parseData, (d) => d.year) || 2025;
    const x = d3.scaleLinear().domain([startYear, maxYear]).range([0, width]);

    const y = d3.scaleLinear().domain([yAxisMin, yAxisMax]).range([height, 0]);

    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .tickSize(-height)
          .tickFormat(() => ""),
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "currentColor").attr("stroke-opacity", 0.1),
      );

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat((d) => `${d}年`))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    g.append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .tickSize(-width)
          .tickFormat(() => ""),
      )
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", "currentColor").attr("stroke-opacity", 0.1),
      );

    g.append("g").call(d3.axisLeft(y).tickFormat((d) => `${d}${yAxisLabel}`));

    selectedMetrics.forEach((metric) => {
      const metricIndex = availableMetrics.indexOf(metric);
      const colorIndex = metricIndex >= 0 ? metricIndex : 0;
      const strokeColor = colors[colorIndex % colors.length] ?? "#000";
      const metricData = parseData.filter((d) => d[metric] !== null);

      const lineGenerator = d3
        .line<(typeof parseData)[0]>()
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
            const tooltip = d3
              .select("body")
              .append("div")
              .attr("class", "tooltip")
              .style("position", "absolute")
              .style("background", "var(--card)")
              .style("color", "var(--foreground)")
              .style("border", "1px solid var(--border)")
              .style("border-radius", "4px")
              .style("padding", "8px")
              .style("pointer-events", "none")
              .style("z-index", "1000");

            const value = d[metric];
            tooltip
              .html(`<strong>${d.year}年</strong><br/>${getLabel(metric)}: ${value}${yAxisLabel}`)
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 28}px`);

            d3.select(this).attr("r", 6);
          })
          .on("mouseout", function () {
            d3.selectAll(".tooltip").remove();
            d3.select(this).attr("r", 4);
          });
      });
    });
  }, [
    data,
    selectedMetrics,
    config,
    startYear,
    yAxisMin,
    yAxisMax,
    yAxisLabel,
    colors,
    getLabel,
    availableMetrics,
  ]);

  const handleLegendClick = (metric: string) => {
    const isActive = selectedMetrics.includes(metric);
    if (isActive) {
      setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const handleGroupClick = (groupMetrics: string[]) => {
    const allSelected = groupMetrics.every((m) => selectedMetrics.includes(m));

    if (allSelected) {
      const newSelected = selectedMetrics.filter((m) => !groupMetrics.includes(m));
      setSelectedMetrics(newSelected);
    } else {
      const newSelected = [...new Set([...selectedMetrics, ...groupMetrics])];
      setSelectedMetrics(newSelected);
    }
  };

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
                onClick={() => handleGroupClick(group.metrics)}
              >
                {group.name}
              </button>
            )}
            <div className="flex flex-wrap gap-4">
              {group.metrics.map((metric, metricIndex) => {
                const index = availableMetrics.indexOf(metric);
                const isActive = selectedMetrics.includes(metric);
                return (
                  <button
                    key={`${metric}-${metricIndex}`}
                    type="button"
                    onClick={() => handleLegendClick(metric)}
                    className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
                    style={{ opacity: isActive ? 1 : 0.3 }}
                  >
                    <div
                      className="w-4 h-4"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <span className="text-sm">{getLabel(metric)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
