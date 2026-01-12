"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
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

export const Sheet1StackedChart: React.FC<Props> = ({ data }) => {
  const svgRef1 = useRef<SVGSVGElement>(null);
  const svgRef2 = useRef<SVGSVGElement>(null);
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

  const renderStackedChart = useCallback(
    (svgElement: SVGSVGElement, group: (typeof groups)[0], groupIndex: number) => {
      const svg = d3.select(svgElement);
      svg.selectAll("*").remove();

      const margin = { top: 20, right: 120, bottom: 60, left: 80 };
      const width = 700 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      // パターン定義を追加
      const defs = svg.append("defs");

      // 各メトリック用のパターンを定義
      const patterns = [
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
      ];

      patterns.forEach((pattern, i) => {
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
      const stack = d3
        .stack<any>()
        .keys(group.metrics)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

      const stackedData = stack(parseData);

      // エリア生成
      const area = d3
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
          .attr("fill", `url(#pattern-${patternIndex % patterns.length}-${groupIndex})`)
          .attr("stroke", strokeColor)
          .attr("stroke-width", 1)
          .attr("d", area);
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
          return `url(#pattern-${patternIndex % patterns.length}-${groupIndex})`;
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
    const group = groups[0];
    if (svgRef1.current && group) {
      renderStackedChart(svgRef1.current, group, 0);
    }
  }, [groups, renderStackedChart]);

  useEffect(() => {
    const group = groups[1];
    if (svgRef2.current && group) {
      renderStackedChart(svgRef2.current, group, 1);
    }
  }, [data, groups, renderStackedChart]);

  const group1 = groups[0];
  const group2 = groups[1];

  return (
    <div className="my-8 space-y-8">
      <div className="text-center font-bold text-base mb-4">
        {data.metadata.title.replace(/^1[\s.、]*/, "")}（帯グラフ）
      </div>

      {group1 ? (
        <div>
          <div className="text-center font-semibold text-sm mb-2">{group1.name}</div>
          <div className="overflow-x-auto">
            <svg ref={svgRef1} />
          </div>
        </div>
      ) : null}

      {group2 ? (
        <div>
          <div className="text-center font-semibold text-sm mb-2">{group2.name}</div>
          <div className="overflow-x-auto">
            <svg ref={svgRef2} />
          </div>
        </div>
      ) : null}
    </div>
  );
};
