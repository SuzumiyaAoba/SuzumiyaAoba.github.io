"use client";

import * as d3 from "d3";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Locale } from "@/shared/lib/routing";
import type { ScheduleRow, YearlyRow, ScenarioData, VisibleState } from "../model/types";
import { useSimulatorFormatters } from "./use-simulator-formatters";

const chartConfig = {
  width: 840,
  height: 360,
  margin: { top: 24, right: 24, bottom: 48, left: 92 },
  colors: {
    grid: "var(--border)",
    axis: "var(--muted-foreground)",
    pointStroke: "var(--card)",
  },
};

const chartSeries = [
  { key: "balance", ja: "評価額", en: "Balance", width: 2, highlightedWidth: 2.8, dashArray: null },
  {
    key: "principal",
    ja: "元本",
    en: "Principal",
    width: 1.6,
    highlightedWidth: 2.2,
    dashArray: "18 6",
  },
  { key: "gain", ja: "運用益", en: "Gain", width: 1.6, highlightedWidth: 2.2, dashArray: "2 6" },
  {
    key: "gainDiff",
    ja: "前年差",
    en: "Year-over-year",
    width: 1.5,
    highlightedWidth: 2.1,
    dashArray: "6 2 1 2",
  },
] as const;

type SimulationChartProps = {
  locale: Locale;
  scenarioData: ScenarioData[];
  selectedScenario: ScenarioData | undefined;
  visibleSeries: VisibleState;
  setVisibleSeries: Dispatch<SetStateAction<VisibleState>>;
};

export function SimulationChart({
  locale,
  scenarioData,
  selectedScenario,
  visibleSeries,
  setVisibleSeries,
}: SimulationChartProps) {
  const { t, numberFormatter, formatYears } = useSimulatorFormatters(locale);
  const chartRef = useRef<SVGSVGElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tableRows = useMemo(() => selectedScenario?.tableRows ?? [], [selectedScenario]);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    row: YearlyRow;
    label: string;
  } | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const tooltipElement = tooltipRef.current;
    if (!tooltipElement) {
      return;
    }
    setTooltipSize({
      width: tooltipElement.offsetWidth,
      height: tooltipElement.offsetHeight,
    });
  }, [tooltip]);

  useEffect(() => {
    const svgElement = chartRef.current;
    if (!svgElement) {
      return;
    }

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    if (scenarioData.length === 0 || !selectedScenario) {
      return;
    }

    const { width, height, margin, colors } = chartConfig;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const lastMonth = selectedScenario.schedule[selectedScenario.schedule.length - 1]?.month ?? 1;
    const maxValue = d3.max(scenarioData, (scenario) =>
      d3.max(scenario.schedule, (row) => Math.max(row.balance, row.principal, row.gain)),
    );
    const maxDiff = d3.max(tableRows, (row) => row.gainDiff);
    const yMax = maxValue ? maxValue * 1.05 : 0;
    const yMaxWithDiff = maxDiff && maxDiff > yMax ? maxDiff * 1.05 : yMax;

    const xScale = d3.scaleLinear().domain([1, lastMonth]).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, yMaxWithDiff]).range([innerHeight, 0]);

    const tickValues = (() => {
      if (lastMonth <= 12) {
        const step = Math.max(1, Math.ceil(lastMonth / 5));
        const values: number[] = [];
        for (let i = 1; i <= lastMonth; i += step) {
          values.push(i);
        }
        if (values[values.length - 1] !== lastMonth) {
          values.push(lastMonth);
        }
        return values;
      }

      const values: number[] = [];
      for (let year = 1; year <= lastMonth / 12; year += 1) {
        values.push(year * 12);
      }
      if (values[values.length - 1] !== lastMonth) {
        values.push(lastMonth);
      }
      return values;
    })();

    const chartGroup = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const gridAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickSize(-innerWidth)
      .tickFormat(() => "");

    const gridGroup = chartGroup.append("g").call(gridAxis);
    gridGroup.selectAll("line").attr("stroke", colors.grid).attr("stroke-opacity", 0.6);
    gridGroup.selectAll(".domain").remove();

    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(tickValues)
      .tickFormat((value) => {
        const monthValue = value as number;
        if (monthValue >= 12) {
          return formatYears(monthValue);
        }
        return locale === "en" ? `${monthValue} mo` : `${monthValue}ヶ月`;
      });

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((value) =>
        locale === "en"
          ? `¥${d3.format(",")((value as number) / 10000)} x10k`
          : `${d3.format(",")((value as number) / 10000)}万円`,
      );

    const xAxisGroup = chartGroup
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis);
    xAxisGroup.selectAll("text").attr("fill", colors.axis).attr("font-size", 11);
    xAxisGroup.selectAll("line").attr("stroke", colors.axis);

    const yAxisGroup = chartGroup.append("g").call(yAxis);
    yAxisGroup.selectAll("text").attr("fill", colors.axis).attr("font-size", 11);
    yAxisGroup.selectAll("line").attr("stroke", colors.axis);

    chartGroup.selectAll("path.domain").attr("stroke", colors.axis);

    const drawSeries = (scenario: ScenarioData, series: (typeof chartSeries)[number]) => {
      if (!visibleSeries[`${scenario.id}:${series.key}`]) {
        return;
      }

      const path = chartGroup
        .append("path")
        .attr("fill", "none")
        .attr("stroke", scenario.color)
        .attr(
          "stroke-width",
          scenario.id === selectedScenario.id ? series.highlightedWidth : series.width,
        )
        .attr("stroke-dasharray", series.dashArray)
        .attr("stroke-linecap", series.dashArray ? "round" : null);

      if (series.key === "gainDiff") {
        const line = d3
          .line<YearlyRow>()
          .x((row) => xScale(row.month))
          .y((row) => yScale(row.gainDiff));
        path.datum(scenario.tableRows).attr("d", line);
      } else {
        const key = series.key;
        const line = d3
          .line<ScheduleRow>()
          .x((row) => xScale(row.month))
          .y((row) => yScale(row[key]));
        path.datum(scenario.schedule).attr("d", line);
      }
    };

    // 評価額の線を先に描き、元本・運用益・前年差の線をその上に重ねる。
    const [balanceSeries, ...secondarySeries] = chartSeries;
    scenarioData.forEach((scenario) => drawSeries(scenario, balanceSeries));
    scenarioData.forEach((scenario) => {
      secondarySeries.forEach((series) => drawSeries(scenario, series));
    });

    const pointData = scenarioData.flatMap((scenario) =>
      visibleSeries[`${scenario.id}:balance`]
        ? scenario.tableRows.map((row) => ({
            row,
            label: scenario.label,
            color: scenario.color,
          }))
        : [],
    );

    const points = chartGroup
      .append("g")
      .selectAll("circle")
      .data(pointData)
      .join("circle")
      .attr("cx", (item) => xScale(item.row.month))
      .attr("cy", (item) => yScale(item.row.balance))
      .attr("r", (item) => (item.label === selectedScenario.label ? 4.5 : 4))
      .attr("fill", (item) => item.color)
      .attr("stroke", colors.pointStroke)
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer");

    points
      .on("mouseenter", (_event, item) => {
        const container = chartContainerRef.current;
        if (!container) {
          return;
        }
        const { left, top } = container.getBoundingClientRect();
        const svgRect = svgElement.getBoundingClientRect();
        const x = svgRect.left + margin.left + xScale(item.row.month) - left;
        const y = svgRect.top + margin.top + yScale(item.row.balance) - top;
        setTooltip({ x, y, row: item.row, label: item.label });
      })
      .on("mousemove", (event, item) => {
        const container = chartContainerRef.current;
        if (!container) {
          return;
        }
        const { left, top } = container.getBoundingClientRect();
        setTooltip({
          x: event.clientX - left,
          y: event.clientY - top,
          row: item.row,
          label: item.label,
        });
      })
      .on("mouseleave", () => {
        setTooltip(null);
      });
  }, [scenarioData, selectedScenario, tableRows, visibleSeries, locale, formatYears]);

  return (
    <div
      ref={chartContainerRef}
      className="mb-8 border rounded-md p-4 relative"
      style={{ backgroundColor: "var(--card)" }}
    >
      <div className="text-sm mb-3 text-foreground/70">{t("推移グラフ", "Trend chart")}</div>
      <svg ref={chartRef} className="w-full h-auto" />
      <div className="mt-4 grid gap-4 text-xs text-foreground/70 md:grid-cols-2">
        {scenarioData.map((scenario) => (
          <div key={scenario.id} className="space-y-2">
            <button
              type="button"
              className="flex items-center gap-2 text-left text-foreground/80"
              onClick={() => {
                const keys = chartSeries.map((series) => `${scenario.id}:${series.key}`);
                setVisibleSeries((prev) => {
                  const allOn = keys.every((key) => prev[key] !== false);
                  const next = { ...prev };
                  keys.forEach((key) => {
                    next[key] = !allOn;
                  });
                  return next;
                });
              }}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: scenario.color }}
              />
              <span>{scenario.label}</span>
            </button>
            {chartSeries.map((series) => {
              const key = `${scenario.id}:${series.key}`;
              return (
                <button
                  key={series.key}
                  type="button"
                  className="flex items-center gap-2 text-left"
                  onClick={() => setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }))}
                  aria-pressed={!!visibleSeries[key]}
                >
                  <svg width="18" height="6" viewBox="0 0 18 6">
                    <line
                      x1="0"
                      y1="3"
                      x2="18"
                      y2="3"
                      stroke={scenario.color}
                      strokeWidth="2"
                      strokeDasharray={series.dashArray ?? undefined}
                      strokeLinecap={series.dashArray ? "round" : undefined}
                    />
                  </svg>
                  <span className={visibleSeries[key] ? "" : "opacity-40"}>
                    {t(series.ja, series.en)}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {tooltip && (
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none text-xs border rounded-md px-3 py-2 shadow"
          style={{
            left: (() => {
              const container = chartContainerRef.current;
              if (!container) {
                return tooltip.x + 12;
              }
              const maxLeft = container.clientWidth - tooltipSize.width - 8;
              return Math.max(8, Math.min(tooltip.x + 12, maxLeft));
            })(),
            top: (() => {
              const container = chartContainerRef.current;
              if (!container) {
                return tooltip.y + 12;
              }
              const maxTop = container.clientHeight - tooltipSize.height - 8;
              return Math.max(8, Math.min(tooltip.y + 12, maxTop));
            })(),
            backgroundColor: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          <div className="mb-1">
            {tooltip.label} · {formatYears(tooltip.row.month)}
          </div>
          <div>
            {t("元本", "Principal")}: {numberFormatter.format(Math.round(tooltip.row.principal))}{" "}
            {t("円", "JPY")}
          </div>
          <div>
            {t("運用益", "Gain")}: {numberFormatter.format(Math.round(tooltip.row.gain))}{" "}
            {t("円", "JPY")}
          </div>
          <div>
            {t("評価額", "Balance")}: {numberFormatter.format(Math.round(tooltip.row.balance))}{" "}
            {t("円", "JPY")}
          </div>
          <div>
            {t("前年差", "YoY gain")}: {numberFormatter.format(Math.round(tooltip.row.gainDiff))}{" "}
            {t("円", "JPY")}
          </div>
        </div>
      )}
    </div>
  );
}
