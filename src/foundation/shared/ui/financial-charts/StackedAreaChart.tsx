"use client";

import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import { max } from "d3-array";
import { scaleLinear } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";
import { select } from "d3-selection";
import { appendChartAxes } from "./chart-axes";
import { area, stack, stackOrderNone, stackOffsetNone } from "d3-shape";
import type { SeriesPoint } from "d3-shape";
import { appendChartPatterns } from "./chart-patterns";

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

type StackedDatum = { year: number } & Record<string, number>;

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
  const chartId = useId();
  const svgRefs = useRef<(SVGSVGElement | null)[]>([]);
  const colors = schemeCategory10;

  const availableMetrics = useMemo(
    () => availableMetricsProp ?? groups.flatMap((g) => g.metrics),
    [availableMetricsProp, groups]
  );

  const renderStackedChart = useCallback(
    (svgElement: SVGSVGElement, group: MetricGroup, groupIndex: number) => {
      const svg = select(svgElement);
      svg.selectAll("*").remove();

      const margin = { top: 20, right: 120, bottom: 60, left: 80 };
      const width = 700 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      const patternFill = appendChartPatterns(
        svgElement,
        colors,
        `${chartId}-${groupIndex}`
      );

      const g = svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // データを変換
      const parseData = data.series.map((d) => {
        const yearData: StackedDatum = { year: Number.parseInt(d.year, 10) };
        for (const metric of group.metrics) {
          yearData[metric] = d.values[metric] ?? 0;
        }
        return yearData;
      });

      if (parseData.length === 0) {
        return;
      }

      // スケール設定
      const maxYear = max(parseData, (d) => d.year) ?? 2025;
      const x = scaleLinear().domain([2006, maxYear]).range([0, width]);

      const y = scaleLinear().domain([0, 100]).range([height, 0]);

      // スタックレイアウト
      const stackGenerator = stack<StackedDatum>()
        .keys(group.metrics)
        .order(stackOrderNone)
        .offset(stackOffsetNone);

      const stackedData = stackGenerator(parseData);

      // エリア生成
      const areaGenerator = area<SeriesPoint<StackedDatum>>()
        .x((d) => x(d.data.year))
        .y0((d) => y(d[0]))
        .y1((d) => y(d[1]));

      appendChartAxes<number>(g, { x, y, width, height });

      // 帯グラフを描画
      for (const layer of stackedData) {
        const metricIndex = availableMetrics.indexOf(layer.key);
        const patternIndex = Math.max(metricIndex, 0);
        const strokeColor = colors[patternIndex % colors.length] ?? "#000";

        g.append("path")
          .datum(layer)
          .attr("fill", patternFill(patternIndex))
          .attr("stroke", strokeColor)
          .attr("stroke-width", 1)
          .attr("d", areaGenerator);
      }

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
          const patternIndex = Math.max(index, 0);
          return patternFill(patternIndex);
        })
        .attr("stroke", (d) => {
          const index = availableMetrics.indexOf(d);
          const colorIndex = Math.max(index, 0);
          return colors[colorIndex % colors.length] ?? "#000";
        })
        .attr("stroke-width", 1);

      legend
        .append("text")
        .attr("x", 20)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .text((d) => d.split("|")[0]?.trim() ?? "");
    },
    [availableMetrics, chartId, colors, data.series]
  );

  useEffect(() => {
    for (const [index, group] of groups.entries()) {
      const svgElement = svgRefs.current[index];
      if (svgElement) {
        renderStackedChart(svgElement, group, index);
      }
    }
  }, [groups, renderStackedChart]);

  return (
    <div className="my-8 space-y-8">
      <div className="mb-4 text-center text-base font-bold">{title}</div>

      {groups.map((group, index) => (
        <div key={group.name || `group-${index}`}>
          <div className="mb-2 text-center text-sm font-semibold">
            {group.name}
          </div>
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
