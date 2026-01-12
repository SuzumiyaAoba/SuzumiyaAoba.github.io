"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { SheetData, MetricGroup, ChartConfig } from "./types";

type Props = {
  data: SheetData;
  groups?: MetricGroup[];
  config?: ChartConfig;
  excludeHeaders?: string[];
};

export const StackedBarChart: React.FC<Props> = ({
  data,
  groups = [],
  config = {},
  excludeHeaders = []
}) => {
  const svgRefs = useRef<(SVGSVGElement | null)[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const colors = config.colors || d3.schemeCategory10;

  const {
    yAxisMin = 0,
    yAxisMax = 100,
    yAxisLabel = "%",
    labelMap = {}
  } = config;

  // ラベルを取得する関数
  const getLabel = (metric: string): string => {
    if (labelMap[metric]) {
      return labelMap[metric];
    }
    // デフォルト: パイプ区切りを整形
    const parts = metric.split("|").map(p => p.trim()).filter(p => p && p !== "％");
    return parts.join("");
  };

  const availableMetrics = data.headers.filter((header) => {
    return !excludeHeaders.includes(header) && data.series.some((s) => s.values[header] !== null);
  });

  const effectiveGroups = groups.length > 0
    ? groups
    : [{ name: "", metrics: availableMetrics }];

  useEffect(() => {
    if (selectedMetrics.length === 0 && availableMetrics.length > 0) {
      setSelectedMetrics(availableMetrics);
    }
  }, [availableMetrics, selectedMetrics.length]);

  const handleLegendClick = (metric: string) => {
    const isActive = selectedMetrics.includes(metric);
    if (isActive) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const handleGroupClick = (groupMetrics: string[]) => {
    const allSelected = groupMetrics.every(m => selectedMetrics.includes(m));

    if (allSelected) {
      const newSelected = selectedMetrics.filter(m => !groupMetrics.includes(m));
      setSelectedMetrics(newSelected);
    } else {
      const newSelected = [...new Set([...selectedMetrics, ...groupMetrics])];
      setSelectedMetrics(newSelected);
    }
  };

  const renderBarChart = (
    svgElement: SVGSVGElement,
    group: MetricGroup,
  ) => {
    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 60, left: 80 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const g = svg
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const activeMetrics = group.metrics.filter(m => selectedMetrics.includes(m));

    if (activeMetrics.length === 0) return;

    const parseData = data.series.map((d) => {
      const yearData: any = { year: Number.parseInt(d.year) };
      activeMetrics.forEach((metric) => {
        yearData[metric] = d.values[metric] || 0;
      });
      return yearData;
    });

    if (parseData.length === 0) return;

    const years = parseData.map(d => d.year);

    const x = d3
      .scaleBand()
      .domain(years.map(String))
      .range([0, width])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([yAxisMin, yAxisMax])
      .range([height, 0]);

    const stack = d3.stack<any>()
      .keys(activeMetrics)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    const stackedData = stack(parseData);

    g.append("g")
      .attr("class", "grid")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3.axisBottom(x)
          .tickValues(years.filter((_, i) => i % 2 === 0).map(String))
          .tickSize(-height)
          .tickFormat(() => "")
      )
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1));

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3.axisBottom(x)
          .tickValues(years.filter((_, i) => i % 2 === 0).map(String))
          .tickFormat((d) => `${d}年`)
      )
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    g.append("g")
      .attr("class", "grid")
      .call(
        d3.axisLeft(y)
          .tickSize(-width)
          .tickFormat(() => "")
      )
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1));

    g.append("g").call(d3.axisLeft(y).tickFormat((d) => `${d}${yAxisLabel}`));

    stackedData.forEach((layer) => {
      const metricIndex = availableMetrics.indexOf(layer.key);
      const colorIndex = metricIndex >= 0 ? metricIndex : 0;
      const barColor = colors[colorIndex % colors.length] ?? "#000";

      g.selectAll(`.bar-${metricIndex}`)
        .data(layer)
        .enter()
        .append("rect")
        .attr("class", `bar-${metricIndex}`)
        .attr("x", (d) => x(String(d.data.year)) || 0)
        .attr("y", (d) => y(d[1]))
        .attr("height", (d) => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .attr("fill", barColor)
        .attr("fill-opacity", 0.7)
        .attr("stroke", barColor)
        .attr("stroke-width", 1);
    });
  };

  useEffect(() => {
    effectiveGroups.forEach((group, index) => {
      if (svgRefs.current[index]) {
        renderBarChart(svgRefs.current[index]!, group);
      }
    });
  }, [data, selectedMetrics, config, yAxisMin, yAxisMax, yAxisLabel]);

  return (
    <div className="my-8 space-y-8">
      <div className="text-center font-bold text-base mb-4">
        {data.metadata.title.replace(/^[0-9]+[\s.、]*/, '')}
      </div>

      {effectiveGroups.map((group, groupIndex) => (
        <div key={group.name || `group-${groupIndex}`}>
          {group.name && (
            <div
              className="text-center font-semibold text-sm mb-2 cursor-pointer hover:text-blue-600"
              onClick={() => handleGroupClick(group.metrics)}
            >
              {group.name}
            </div>
          )}
          <div className="overflow-x-auto">
            <svg ref={(el) => { svgRefs.current[groupIndex] = el; }} />
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            {group.metrics.map((metric) => {
              const index = availableMetrics.indexOf(metric);
              const isActive = selectedMetrics.includes(metric);
              return (
                <div
                  key={metric}
                  onClick={() => handleLegendClick(metric)}
                  className="flex items-center gap-2 cursor-pointer"
                  style={{ opacity: isActive ? 1 : 0.3 }}
                >
                  <div
                    className="w-4 h-4"
                    style={{ backgroundColor: colors[index % colors.length], opacity: 0.7 }}
                  />
                  <span className="text-sm">{getLabel(metric)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
