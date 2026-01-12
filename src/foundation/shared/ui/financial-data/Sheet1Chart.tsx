"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

type SeriesData = {
  year: string;
  values: Record<string, number | null>;
};

type SheetData = {
  metadata: {
    title: string;
    toc_title?: string;
  };
  headers: string[];
  series: SeriesData[];
};

type Props = {
  data: SheetData;
};

export const Sheet1Chart: React.FC<Props> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const colors = d3.schemeCategory10;

  // グループヘッダーを定義
  const groupHeaders = [
    "口座の有無 （注１） | 口座を保有 している | ％",
    "現在保有している金融商品 | 預貯金 （ゆうちょ銀行の貯金を含む） | ％",
  ];

  // データがあるメトリクスを取得（グループヘッダーを除外）
  const availableMetrics = data.headers.filter((header) => {
    return !groupHeaders.includes(header) && data.series.some((s) => s.values[header] !== null);
  });

  // グループ情報を作成
  const groups = [
    {
      name: "口座の有無（注１）",
      metrics: availableMetrics.filter((m) => {
        const headerIdx = data.headers.indexOf(m);
        return headerIdx > 0 && headerIdx < 5;
      }),
    },
    {
      name: "現在保有している金融商品",
      metrics: availableMetrics.filter((m) => {
        const headerIdx = data.headers.indexOf(m);
        return headerIdx >= 6;
      }),
    },
  ];

  useEffect(() => {
    // デフォルトですべて選択
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

    type ParsedDatum = { year: number } & Record<string, number | null>;
    const parseData: ParsedDatum[] = data.series
      .map((d) => ({
        year: Number.parseInt(d.year),
        ...selectedMetrics.reduce(
          (acc, metric) => {
            acc[metric] = d.values[metric] ?? null;
            return acc;
          },
          {} as Record<string, number | null>,
        ),
      }))
      .filter((d): d is ParsedDatum =>
        selectedMetrics.some((m) => (d as Record<string, number | null>)[m] !== null),
      );

    if (parseData.length === 0) return;

    const maxYear = d3.max(parseData, (d) => d.year) || 2025;
    const x = d3.scaleLinear().domain([2006, maxYear]).range([0, width]);

    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

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

    selectedMetrics.forEach((metric) => {
      const metricIndex = availableMetrics.indexOf(metric);
      const colorIndex = metricIndex >= 0 ? metricIndex : 0;
      const strokeColor = colors[colorIndex % colors.length] ?? "#000";
      const metricData = parseData.filter((d) => d[metric] !== null);

      const line = d3
        .line<(typeof parseData)[0] & Record<string, number | null>>()
        .x((d) => x(d.year))
        .y((d) => y((d[metric] as number) || 0));

      g.append("path")
        .datum(metricData)
        .attr("fill", "none")
        .attr("stroke", strokeColor)
        .attr("stroke-width", 2)
        .attr("d", line);

      // ドットを描画
      metricData.forEach((d) => {
        g.append("circle")
          .attr("cx", x(d.year))
          .attr("cy", y((d[metric] as number) || 0))
          .attr("r", 4)
          .attr("fill", strokeColor)
          .on("mouseover", function (event) {
            const tooltip = d3
              .select("body")
              .append("div")
              .attr("class", "tooltip")
              .style("position", "absolute")
              .style("background", "white")
              .style("border", "1px solid #ccc")
              .style("border-radius", "4px")
              .style("padding", "8px")
              .style("pointer-events", "none")
              .style("z-index", "1000");

            const value = d[metric];
            tooltip
              .html(
                `<strong>${d.year}年</strong><br/>${metric.split("|")[0]?.trim() ?? ""}: ${value}%`,
              )
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
  }, [data, selectedMetrics, colors, availableMetrics]);

  const handleLegendClick = (metric: string) => {
    const isActive = selectedMetrics.includes(metric);
    if (isActive) {
      setSelectedMetrics(selectedMetrics.filter((m) => m !== metric));
    } else {
      setSelectedMetrics([...selectedMetrics, metric]);
    }
  };

  const handleGroupClick = (groupMetrics: string[]) => {
    // グループ内のメトリクスがすべて選択されているかチェック
    const allSelected = groupMetrics.every((m) => selectedMetrics.includes(m));

    if (allSelected) {
      // すべて選択されている場合は、グループのメトリクスをすべて非選択に
      const newSelected = selectedMetrics.filter((m) => !groupMetrics.includes(m));
      setSelectedMetrics(newSelected);
    } else {
      // 一部または全部が非選択の場合は、グループのメトリクスをすべて選択に
      const newSelected = [...new Set([...selectedMetrics, ...groupMetrics])];
      setSelectedMetrics(newSelected);
    }
  };

  return (
    <div className="my-8">
      <div className="text-center font-bold text-base mb-4">
        {data.metadata.title.replace(/^1[\s.、]*/, "")}
      </div>
      <div className="overflow-x-auto">
        <svg ref={svgRef} />
      </div>

      <div className="mt-4 space-y-4">
        {groups.map((group) => (
          <div key={group.name}>
            <button
              type="button"
              className="font-semibold text-sm mb-2 cursor-pointer hover:text-blue-600 bg-transparent border-none p-0 text-left"
              onClick={() => handleGroupClick(group.metrics)}
            >
              {group.name}
            </button>
            <div className="flex flex-wrap gap-4">
              {group.metrics.map((metric) => {
                const safeMetric = metric ?? "";
                if (!safeMetric) {
                  return null;
                }
                const index = availableMetrics.indexOf(safeMetric);
                const isActive = selectedMetrics.includes(safeMetric);
                const colorIndex = index >= 0 ? index : 0;
                const swatch = colors[colorIndex % colors.length] ?? "#000";
                return (
                  <button
                    key={safeMetric}
                    type="button"
                    onClick={() => handleLegendClick(safeMetric)}
                    className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0"
                    style={{ opacity: isActive ? 1 : 0.3 }}
                  >
                    <div className="w-4 h-4" style={{ backgroundColor: swatch }} />
                    <span className="text-sm">{safeMetric.split("|")[0]?.trim() ?? ""}</span>
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
