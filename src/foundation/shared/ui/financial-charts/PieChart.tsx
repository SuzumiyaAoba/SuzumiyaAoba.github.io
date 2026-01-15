"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { ChartConfig } from "./types";

type PieData = {
  label: string;
  value: number;
};

type Props = {
  data: PieData[];
  title: string;
  config?: ChartConfig;
};

export const PieChart: React.FC<Props> = ({ data, title, config = {} }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const colors = config.colors || d3.schemeCategory10;

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 700;
    const radius = 86; // 55 * 1.25 * 1.25
    const labelRadius = radius * 1.8; // 小さい値用のラベルを収めるため大きく
    const height = labelRadius * 2 + 20; // ラベルを含めた上下のマージン

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3
      .pie<PieData>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<PieData>>().innerRadius(0).outerRadius(radius);

    const arcs = g.selectAll(".arc").data(pie(data)).enter().append("g").attr("class", "arc");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (_d, i) => colors[i % colors.length] ?? "#000")
      .attr("stroke", "var(--card)")
      .attr("stroke-width", 2)
      .on("mouseover", function (event, d) {
        d3.select(this).transition().duration(200).attr("opacity", 0.7);

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

        tooltip
          .html(`<strong>${d.data.label}</strong><br/>${d.data.value}%`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 28}px`);
      })
      .on("mouseout", function () {
        d3.select(this).transition().duration(200).attr("opacity", 1);

        d3.selectAll(".tooltip").remove();
      });

    // リーダー線とラベルを追加
    g.selectAll("polyline")
      .data(pie(data))
      .enter()
      .append("polyline")
      .attr("stroke", "currentColor")
      .attr("stroke-width", 1)
      .attr("fill", "none")
      .attr("opacity", 0.5)
      .attr("points", (d) => {
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;

        // 値が小さいほどリーダーラインを長くする
        const value = d.data.value;
        let radiusMultiplier = 1.4; // デフォルト

        if (value < 5) {
          radiusMultiplier = 1.6; // 5%未満の場合はさらに長く
        } else if (value < 8) {
          radiusMultiplier = 1.5; // 8%未満の場合は少し長く
        }

        // outerArcの代わりに動的に計算
        const outerRadius = radius * radiusMultiplier;
        const outerX = outerRadius * Math.cos(midAngle - Math.PI / 2);
        const outerY = outerRadius * Math.sin(midAngle - Math.PI / 2);

        // 水平方向の距離を調整（値に応じて）
        let horizontalMultiplier = 1.5;
        if (value < 5) {
          horizontalMultiplier = 1.9; // 5%未満の場合はさらに外側に
        } else if (value < 8) {
          horizontalMultiplier = 1.7; // 8%未満の場合は少し外側に
        }

        const finalX = radius * horizontalMultiplier * (midAngle < Math.PI ? 1 : -1);

        const arcPos = arc.centroid(d);

        return [arcPos, [outerX, outerY], [finalX, outerY]].map((p) => p.join(",")).join(" ");
      });

    // 外側のラベル
    g.selectAll("text.label")
      .data(pie(data))
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("transform", (d) => {
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;

        // 値が小さいほどラベルを遠くに配置（リーダーラインと同じ）
        const value = d.data.value;
        let radiusMultiplier = 1.4;

        if (value < 5) {
          radiusMultiplier = 1.6;
        } else if (value < 8) {
          radiusMultiplier = 1.5;
        }

        const outerRadius = radius * radiusMultiplier;
        const outerY = outerRadius * Math.sin(midAngle - Math.PI / 2);

        // 水平方向の距離を調整（値に応じて）
        let horizontalMultiplier = 1.55;

        if (value < 5) {
          horizontalMultiplier = 2.0; // 5%未満の場合はさらに外側に
        } else if (value < 8) {
          horizontalMultiplier = 1.75; // 8%未満の場合は少し外側に
        }

        const finalX = radius * horizontalMultiplier * (midAngle < Math.PI ? 1 : -1);

        return `translate(${finalX},${outerY})`;
      })
      .attr("text-anchor", (d) => {
        const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
        return midAngle < Math.PI ? "start" : "end";
      })
      .attr("font-size", "11px")
      .text((d) => `${d.data.label} (${d.data.value}%)`);
  }, [data, colors]);

  return (
    <div className="flex flex-col items-center">
      <div className="font-bold text-base mb-1">{title}</div>
      <svg ref={svgRef} />
    </div>
  );
};
