"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";

import type { SheetData, MetricGroup } from "./types";

type Props = {
  data: SheetData;
  /** パネル分割の単位となるグループ(表示順) */
  groups: MetricGroup[];
  /**
   * 色・パターンの割り当てに使う基準となるメトリクスの全体集合(グループ横断)。
   * 未指定の場合は groups の metrics を結合した順序を使う。
   */
  availableMetrics?: string[];
  title: string;
};

const PATTERNS = [
  { id: "pattern-0", type: "horizontal" },
  { id: "pattern-1", type: "vertical" },
  { id: "pattern-2", type: "diagonal-right" },
  { id: "pattern-3", type: "diagonal-left" },
  { id: "pattern-4", type: "dots" },
  { id: "pattern-5", type: "cross" },
  { id: "pattern-6", type: "grid" },
  { id: "pattern-7", type: "horizontal-thick" },
  { id: "pattern-8", type: "vertical-thick" },
  { id: "pattern-9", type: "diagonal-cross" },
] as const;

/**
 * 連続X軸(年)の積み上げエリアチャート(帯グラフ)。パターン塗り・静的凡例が特徴。
 * financial-data/Sheet1StackedChart のd3描画ロジックをそのまま切り出したもの。
 * 離散カテゴリ・単色塗り・トグル凡例の StackedBarChart とは別のチャート種別。
 */
export const StackedAreaChart: React.FC<Props> = ({
  data,
  groups,
  availableMetrics: availableMetricsProp,
  title,
}) => {
  const svgRefs = useRef<(SVGSVGElement | null)[]>([]);
  const colors = d3.schemeCategory10;

  const availableMetrics = useMemo(
    () => availableMetricsProp ?? groups.flatMap((g) => g.metrics),
    [availableMetricsProp, groups],
  );

  const renderStackedChart = useCallback(
    (svgElement: SVGSVGElement, group: MetricGroup, groupIndex: number) => {
      const svg = d3.select(svgElement);
      svg.selectAll("*").remove();

      const margin = { top: 20, right: 120, bottom: 60, left: 80 };
      const width = 700 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      // パターン定義を追加
      const defs = svg.append("defs");

      PATTERNS.forEach((pattern, i) => {
        const patternEl = defs
          .append("pattern")
          .attr("id", `${pattern.id}-${groupIndex}`)
          .attr("patternUnits", "userSpaceOnUse")
          .attr("width", 8)
          .attr("height", 8);

        const color = colors[i % colors.length] ?? "#000";

        switch (pattern.type) {
          case "horizontal":
            patternEl
              .append("line")
              .attr("x1", 0)
              .attr("y1", 4)
              .attr("x2", 8)
              .attr("y2", 4)
              .attr("stroke", color)
              .attr("stroke-width", 2);
            break;
          case "vertical":
            patternEl
              .append("line")
              .attr("x1", 4)
              .attr("y1", 0)
              .attr("x2", 4)
              .attr("y2", 8)
              .attr("stroke", color)
              .attr("stroke-width", 2);
            break;
          case "diagonal-right":
            patternEl
              .append("line")
              .attr("x1", 0)
              .attr("y1", 0)
              .attr("x2", 8)
              .attr("y2", 8)
              .attr("stroke", color)
              .attr("stroke-width", 2);
            break;
          case "diagonal-left":
            patternEl
              .append("line")
              .attr("x1", 0)
              .attr("y1", 8)
              .attr("x2", 8)
              .attr("y2", 0)
              .attr("stroke", color)
              .attr("stroke-width", 2);
            break;
          case "dots":
            patternEl.append("circle").attr("cx", 4).attr("cy", 4).attr("r", 2).attr("fill", color);
            break;
          case "cross":
            patternEl
              .append("line")
              .attr("x1", 0)
              .attr("y1", 4)
              .attr("x2", 8)
              .attr("y2", 4)
              .attr("stroke", color)
              .attr("stroke-width", 1);
            patternEl
              .append("line")
              .attr("x1", 4)
              .attr("y1", 0)
              .attr("x2", 4)
              .attr("y2", 8)
              .attr("stroke", color)
              .attr("stroke-width", 1);
            break;
          case "grid":
            patternEl
              .append("rect")
              .attr("width", 8)
              .attr("height", 8)
              .attr("fill", "none")
              .attr("stroke", color)
              .attr("stroke-width", 1);
            break;
          case "horizontal-thick":
            patternEl
              .append("rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", 8)
              .attr("height", 3)
              .attr("fill", color);
            break;
          case "vertical-thick":
            patternEl
              .append("rect")
              .attr("x", 0)
              .attr("y", 0)
              .attr("width", 3)
              .attr("height", 8)
              .attr("fill", color);
            break;
          case "diagonal-cross":
            patternEl
              .append("line")
              .attr("x1", 0)
              .attr("y1", 0)
              .attr("x2", 8)
              .attr("y2", 8)
              .attr("stroke", color)
              .attr("stroke-width", 1);
            patternEl
              .append("line")
              .attr("x1", 0)
              .attr("y1", 8)
              .attr("x2", 8)
              .attr("y2", 0)
              .attr("stroke", color)
              .attr("stroke-width", 1);
            break;
        }
      });

      const g = svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // データを変換
      const parseData = data.series.map((d) => {
        const yearData: any = { year: Number.parseInt(d.year) };
        group.metrics.forEach((metric) => {
          yearData[metric] = d.values[metric] || 0;
        });
        return yearData;
      });

      if (parseData.length === 0) return;

      // スケール設定
      const maxYear = d3.max(parseData, (d) => d.year) || 2025;
      const x = d3.scaleLinear().domain([2006, maxYear]).range([0, width]);

      const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

      // スタックレイアウト
      const stackGenerator = d3
        .stack<any>()
        .keys(group.metrics)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const stackedData = stackGenerator(parseData);

      // エリア生成
      const areaGenerator = d3
        .area<any>()
        .x((d) => x(d.data.year))
        .y0((d) => y(d[0]))
        .y1((d) => y(d[1]));

      // X軸のグリッド線
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

      // X軸
      g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat((d) => `${d}年`))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      // Y軸のグリッド線
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

      // Y軸
      g.append("g").call(d3.axisLeft(y).tickFormat((d) => `${d}%`));

      // 帯グラフを描画
      stackedData.forEach((layer) => {
        const metricIndex = availableMetrics.indexOf(layer.key);
        const patternIndex = metricIndex >= 0 ? metricIndex : 0;
        const strokeColor = colors[patternIndex % colors.length] ?? "#000";

        g.append("path")
          .datum(layer)
          .attr("fill", `url(#pattern-${patternIndex % PATTERNS.length}-${groupIndex})`)
          .attr("stroke", strokeColor)
          .attr("stroke-width", 1)
          .attr("d", areaGenerator);
      });

      // レジェンド
      const legend = g
        .append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "start")
        .selectAll("g")
        .data(group.metrics)
        .enter()
        .append("g")
        .attr("transform", (_d, i) => `translate(${width + 10},${i * 18})`);

      legend
        .append("rect")
        .attr("x", 0)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", (d) => {
          const index = availableMetrics.indexOf(d);
          const patternIndex = index >= 0 ? index : 0;
          return `url(#pattern-${patternIndex % PATTERNS.length}-${groupIndex})`;
        })
        .attr("stroke", (d) => {
          const index = availableMetrics.indexOf(d);
          const colorIndex = index >= 0 ? index : 0;
          return colors[colorIndex % colors.length] ?? "#000";
        })
        .attr("stroke-width", 1);

      legend
        .append("text")
        .attr("x", 20)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .text((d) => d?.split("|")[0]?.trim() ?? "");
    },
    [availableMetrics, colors, data.series],
  );

  useEffect(() => {
    groups.forEach((group, index) => {
      const svgElement = svgRefs.current[index];
      if (svgElement) {
        renderStackedChart(svgElement, group, index);
      }
    });
  }, [groups, renderStackedChart]);

  return (
    <div className="my-8 space-y-8">
      <div className="text-center font-bold text-base mb-4">{title}</div>

      {groups.map((group, index) => (
        <div key={group.name || `group-${index}`}>
          <div className="text-center font-semibold text-sm mb-2">{group.name}</div>
          <div className="overflow-x-auto">
            <svg
              ref={(el) => {
                svgRefs.current[index] = el;
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
