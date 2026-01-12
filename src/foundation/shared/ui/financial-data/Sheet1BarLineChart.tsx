"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export const Sheet1BarLineChart: React.FC<Props> = ({ data }) => {
  const svgRef1 = useRef<SVGSVGElement>(null);
  const svgRef2 = useRef<SVGSVGElement>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const colors = d3.schemeCategory10;

  // グループヘッダーを定義
  const groupHeaders = useMemo(
    () => [
      "口座の有無 （注１） | 口座を保有 している | ％",
      "現在保有している金融商品 | 預貯金 （ゆうちょ銀行の貯金を含む） | ％",
    ],
    [],
  );

  // データがあるメトリクスを取得（グループヘッダーを除外）
  const availableMetrics = useMemo(() => {
    return data.headers.filter((header) => {
      return !groupHeaders.includes(header) && data.series.some((s) => s.values[header] !== null);
    });
  }, [data, groupHeaders]);

  // グループ情報を作成
  const groups = useMemo(() => {
    return [
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
  }, [availableMetrics, data.headers]);

  useEffect(() => {
    // デフォルトですべて選択
    if (selectedMetrics.length === 0 && availableMetrics.length > 0) {
      setSelectedMetrics(availableMetrics);
    }
  }, [availableMetrics, selectedMetrics.length]);

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

  const renderBarLineChart = useCallback(
    (svgElement: SVGSVGElement, group: (typeof groups)[0]) => {
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

      // 選択されているメトリクスのみをフィルタリング
      const activeMetrics = group.metrics.filter((m) => selectedMetrics.includes(m));

      if (activeMetrics.length === 0) return;

      // データを変換
      const parseData = data.series.map((d) => {
        const yearData: any = { year: Number.parseInt(d.year) };
        activeMetrics.forEach((metric) => {
          yearData[metric] = d.values[metric] || 0;
        });
        return yearData;
      });

      if (parseData.length === 0) return;

      // スケール設定
      const years = parseData.map((d) => d.year);

      const x = d3.scaleBand().domain(years.map(String)).range([0, width]).padding(0.3);

      const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

      // スタックレイアウト
      const stack = d3
        .stack<any>()
        .keys(activeMetrics)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const stackedData = stack(parseData);

      // X軸のグリッド線
      g.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(
          d3
            .axisBottom(x)
            .tickValues(years.filter((_, i) => i % 2 === 0).map(String))
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
        .call(
          d3
            .axisBottom(x)
            .tickValues(years.filter((_, i) => i % 2 === 0).map(String))
            .tickFormat((d) => `${d}年`),
        )
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

      // 積み上げ棒グラフを描画
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
    },
    [availableMetrics, colors, data.series, selectedMetrics],
  );

  useEffect(() => {
    const group = groups[0];
    if (svgRef1.current && group) {
      renderBarLineChart(svgRef1.current, group);
    }
  }, [groups, renderBarLineChart]);

  useEffect(() => {
    const group = groups[1];
    if (svgRef2.current && group) {
      renderBarLineChart(svgRef2.current, group);
    }
  }, [groups, renderBarLineChart]);

  const group1 = groups[0];
  const group2 = groups[1];

  return (
    <div className="my-8 space-y-8">
      <div className="text-center font-bold text-base mb-4">
        {data.metadata.title.replace(/^1[\s.、]*/, "")}（積み上げ棒グラフ）
      </div>

      {group1 ? (
        <div>
          <button
            type="button"
            className="text-center font-semibold text-sm mb-2 cursor-pointer hover:text-blue-600 bg-transparent border-none p-0 w-full"
            onClick={() => handleGroupClick(group1.metrics)}
          >
            {group1.name}
          </button>
          <div className="overflow-x-auto">
            <svg ref={svgRef1} />
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            {group1.metrics.map((metric) => {
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
                  <div className="w-4 h-4" style={{ backgroundColor: swatch, opacity: 0.7 }} />
                  <span className="text-sm">{safeMetric.split("|")[0]?.trim() ?? ""}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {group2 ? (
        <div>
          <button
            type="button"
            className="text-center font-semibold text-sm mb-2 cursor-pointer hover:text-blue-600 bg-transparent border-none p-0 w-full"
            onClick={() => handleGroupClick(group2.metrics)}
          >
            {group2.name}
          </button>
          <div className="overflow-x-auto">
            <svg ref={svgRef2} />
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            {group2.metrics.map((metric) => {
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
                  <div className="w-4 h-4" style={{ backgroundColor: swatch, opacity: 0.7 }} />
                  <span className="text-sm">{safeMetric.split("|")[0]?.trim() ?? ""}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
