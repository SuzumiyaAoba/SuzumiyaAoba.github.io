"use client";

import { axisBottom, axisLeft, format, line, max, scaleLinear, select } from "d3";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type Row = {
  month: number;
  principal: number;
  gain: number;
  balance: number;
};

type TableRow = Row & {
  gainDiff: number;
};

type ScenarioInput = {
  id: string;
  name: string;
  monthlyContributionInput: string;
  annualRateInput: string;
};

type ScenarioData = {
  id: string;
  monthlyContribution: number;
  annualRate: number;
  schedule: Row[];
  tableRows: TableRow[];
  color: string;
  label: string;
};

const numberFormatter = new Intl.NumberFormat("ja-JP");

const inputStyle = {
  color: "var(--foreground)",
  backgroundColor: "var(--input-bg)",
};

const formatYenWithMan = (value: number) => {
  const yen = Math.round(value);
  const man = Math.floor(yen / 10000);
  return `${numberFormatter.format(yen)} 円 (${numberFormatter.format(man)} 万円)`;
};

const formatYears = (months: number) => {
  const yearsValue = months / 12;
  if (Number.isInteger(yearsValue)) {
    return `${yearsValue}年`;
  }
  return `${yearsValue.toFixed(1)}年`;
};

const chartConfig = {
  width: 840,
  height: 360,
  margin: { top: 24, right: 24, bottom: 48, left: 92 },
  colors: {
    grid: "rgba(0, 0, 0, 0.08)",
    axis: "rgba(0, 0, 0, 0.6)",
  },
};

const scenarioPalette = [
  "#5B4EAD",
  "#2E8B8B",
  "#D85C3A",
  "#C2477D",
  "#C9A227",
  "#3E8E5C",
  "#C8B53C",
  "#2F7FB7",
  "#4A4F7A",
  "#C46A4A",
];

const defaultScenarios: ScenarioInput[] = [
  {
    id: "scenario-1",
    name: "パターン1",
    monthlyContributionInput: "30000",
    annualRateInput: "5",
  },
];

const normalizeScenarioList = (list: ScenarioInput[]) =>
  list.map((item, index) => ({
    id: item.id || `scenario-${index + 1}`,
    name: item.name || `パターン${index + 1}`,
    monthlyContributionInput: item.monthlyContributionInput ?? "",
    annualRateInput: item.annualRateInput ?? "",
  }));

type VisibleState = Record<string, boolean>;
type ColorState = Record<string, string>;

const normalizeVisibleState = (
  value: unknown,
  scenarioList: ScenarioInput[],
): VisibleState => {
  if (!value || typeof value !== "object") {
    return {};
  }
  const raw = value as Record<string, unknown>;
  const next: VisibleState = {};
  scenarioList.forEach((scenario) => {
    const baseKey = scenario.id;
    const keys = ["balance", "principal", "gain", "gainDiff"];
    keys.forEach((suffix) => {
      const key = `${baseKey}:${suffix}`;
      const rawValue = raw[key];
      if (typeof rawValue === "boolean") {
        next[key] = rawValue;
      }
    });
  });
  return next;
};

const normalizeColorState = (
  value: unknown,
  scenarioList: ScenarioInput[],
): ColorState => {
  if (!value || typeof value !== "object") {
    return {};
  }
  const raw = value as Record<string, unknown>;
  const next: ColorState = {};
  scenarioList.forEach((scenario) => {
    const rawValue = raw[scenario.id];
    if (typeof rawValue === "string" && rawValue.startsWith("#")) {
      next[scenario.id] = rawValue;
    }
  });
  return next;
};

const encodeVisibilityPayload = (
  visible: VisibleState,
  colors: ColorState,
  scenarioList: ScenarioInput[],
) => {
  const normalizedVisible = normalizeVisibleState(visible, scenarioList);
  const normalizedColors = normalizeColorState(colors, scenarioList);
  return compressToEncodedURIComponent(
    JSON.stringify({
      visible: normalizedVisible,
      colors: normalizedColors,
    }),
  );
};

const decodeVisibilityPayload = (
  value: string,
  scenarioList: ScenarioInput[],
): { visible: VisibleState; colors: ColorState } | null => {
  const json = decompressFromEncodedURIComponent(value);
  if (!json) {
    return null;
  }
  try {
    const parsed = JSON.parse(json) as {
      visible?: unknown;
      colors?: unknown;
    };
    return {
      visible: normalizeVisibleState(parsed.visible, scenarioList),
      colors: normalizeColorState(parsed.colors, scenarioList),
    };
  } catch {
    return null;
  }
};
const normalizeScenarios = (value: unknown): ScenarioInput[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const raw = item as Record<string, unknown>;
      const monthlyContributionInput = raw.monthlyContributionInput;
      const annualRateInput = raw.annualRateInput;
      if (
        typeof monthlyContributionInput !== "string" ||
        typeof annualRateInput !== "string"
      ) {
        return null;
      }
      const id =
        typeof raw.id === "string" ? raw.id : `scenario-${index + 1}`;
      const name =
        typeof raw.name === "string" ? raw.name : `パターン${index + 1}`;

      return {
        id,
        name,
        monthlyContributionInput,
        annualRateInput,
      };
    })
    .filter((item): item is ScenarioInput => item !== null);

  return normalized.length > 0 ? normalized : null;
};

const encodeScenarios = (value: ScenarioInput[]) =>
  compressToEncodedURIComponent(JSON.stringify(normalizeScenarioList(value)));

const isSameScenarios = (a: ScenarioInput[], b: ScenarioInput[]) =>
  JSON.stringify(normalizeScenarioList(a)) ===
  JSON.stringify(normalizeScenarioList(b));

const decodeScenarios = (value: string): ScenarioInput[] | null => {
  const json = decompressFromEncodedURIComponent(value);
  if (!json) {
    return null;
  }
  try {
    return normalizeScenarios(JSON.parse(json));
  } catch {
    return null;
  }
};

export default function AssetFormationSimulator() {
  const [compressedParam, setCompressedParam] = useQueryState(
    "p",
    parseAsString,
  );
  const [scenarios, setScenarios] =
    useState<ScenarioInput[]>(defaultScenarios);
  const [selectedScenarioId, setSelectedScenarioId] = useState("scenario-1");
  const [yearsInput, setYearsInput] = useState("20");
  const chartRef = useRef<SVGSVGElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const lastEncodedRef = useRef<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [visibleSeriesParam, setVisibleSeriesParam] = useQueryState(
    "v",
    parseAsString,
  );
  const [visibleSeries, setVisibleSeries] = useState<VisibleState>({});
  const [colorOverrides, setColorOverrides] = useState<ColorState>({});
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    row: TableRow;
    label: string;
  } | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 0, height: 0 });

  const scenarioList = scenarios ?? defaultScenarios;
  const years = Number(yearsInput) || 0;

  const syncScenarios = useCallback(
    (updater: (prev: ScenarioInput[]) => ScenarioInput[]) => {
      setScenarios((prev) => {
        const next = updater(prev);
        const encoded = encodeScenarios(next);
        lastEncodedRef.current = encoded;
        setCompressedParam(encoded);
        return next;
      });
    },
    [setCompressedParam],
  );

  const scenarioData = useMemo<ScenarioData[]>(() => {
    const monthsCount = Math.max(0, Math.floor(years * 12));

    return scenarioList.map((scenario, index) => {
      const monthlyContribution = Number(scenario.monthlyContributionInput) || 0;
      const annualRate = Number(scenario.annualRateInput) || 0;
      const schedule: Row[] = [];

      if (monthsCount > 0) {
        const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
        let balance = 0;
        let principal = 0;

        for (let i = 1; i <= monthsCount; i += 1) {
          balance = balance * (1 + monthlyRate) + monthlyContribution;
          principal += monthlyContribution;
          const gain = balance - principal;
          schedule.push({ month: i, principal, gain, balance });
        }
      }

      const yearlyRows = schedule.filter((row) => row.month % 12 === 0);
      const tableRows = yearlyRows.map((row, rowIndex) => {
        const previous = yearlyRows[rowIndex - 1];
        const gainDiff = previous ? row.gain - previous.gain : row.gain;
        return { ...row, gainDiff };
      });

      const color =
        colorOverrides[scenario.id] ??
        scenarioPalette[index % scenarioPalette.length];

      return {
        id: scenario.id,
        monthlyContribution,
        annualRate,
        schedule,
        tableRows,
        color,
        label: scenario.name || `パターン${index + 1}`,
      };
    });
  }, [scenarioList, years, colorOverrides]);

  const selectedScenario =
    scenarioData.find((scenario) => scenario.id === selectedScenarioId) ??
    scenarioData[0];

  const summary = selectedScenario?.schedule.at(-1) ?? {
    principal: 0,
    gain: 0,
    balance: 0,
  };

  const tableRows = selectedScenario?.tableRows ?? [];

  useEffect(() => {
    setVisibleSeries((prev) => {
      const next: VisibleState = { ...prev };
      scenarioList.forEach((scenario) => {
        const defaults: Record<string, boolean> = {
          balance: true,
          principal: true,
          gain: false,
          gainDiff: false,
        };
        Object.entries(defaults).forEach(([suffix, defaultValue]) => {
          const key = `${scenario.id}:${suffix}`;
          if (next[key] === undefined) {
            next[key] = defaultValue;
          }
        });
      });
      return next;
    });
  }, [scenarioList]);

  useEffect(() => {
    if (!visibleSeriesParam) {
      return;
    }
    const decoded = decodeVisibilityPayload(visibleSeriesParam, scenarioList);
    if (!decoded) {
      return;
    }
    setVisibleSeries((prev) => ({ ...prev, ...decoded.visible }));
    setColorOverrides((prev) => ({ ...prev, ...decoded.colors }));
  }, [visibleSeriesParam, scenarioList]);

  useEffect(() => {
    if (Object.keys(visibleSeries).length === 0) {
      return;
    }
    const encoded = encodeVisibilityPayload(
      visibleSeries,
      colorOverrides,
      scenarioList,
    );
    if (encoded !== visibleSeriesParam) {
      setVisibleSeriesParam(encoded);
    }
  }, [
    visibleSeries,
    colorOverrides,
    scenarioList,
    visibleSeriesParam,
    setVisibleSeriesParam,
  ]);

  useEffect(() => {
    if (!compressedParam) {
      return;
    }
    if (lastEncodedRef.current) {
      if (compressedParam !== lastEncodedRef.current) {
        return;
      }
      lastEncodedRef.current = null;
      return;
    }
    const decoded = decodeScenarios(compressedParam);
    if (!decoded) {
      return;
    }
    setScenarios((prev) => (isSameScenarios(prev, decoded) ? prev : decoded));
  }, [compressedParam]);

  useEffect(() => {
    const encoded = encodeScenarios(scenarioList);
    if (compressedParam !== encoded) {
      lastEncodedRef.current = encoded;
      setCompressedParam(encoded);
    }
  }, [
    scenarioList,
    compressedParam,
    setCompressedParam,
  ]);

  useEffect(() => {
    if (!selectedScenarioId && scenarioList[0]) {
      setSelectedScenarioId(scenarioList[0].id);
      return;
    }
    if (
      scenarioList.length > 0 &&
      !scenarioList.some((s) => s.id === selectedScenarioId)
    ) {
      setSelectedScenarioId(scenarioList[0].id);
    }
  }, [scenarioList, selectedScenarioId]);

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

    const svg = select(svgElement);
    svg.selectAll("*").remove();

    if (scenarioData.length === 0 || !selectedScenario) {
      return;
    }

    const { width, height, margin, colors } = chartConfig;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const lastMonth =
      selectedScenario.schedule[selectedScenario.schedule.length - 1]?.month ??
      1;
    const maxValue = max(scenarioData, (scenario) =>
      max(scenario.schedule, (row) =>
        Math.max(row.balance, row.principal, row.gain),
      ),
    );
    const maxDiff = max(tableRows, (row) => row.gainDiff);
    const yMax = maxValue ? maxValue * 1.05 : 0;
    const yMaxWithDiff =
      maxDiff && maxDiff > yMax ? maxDiff * 1.05 : yMax;

    const xScale = scaleLinear().domain([1, lastMonth]).range([0, innerWidth]);
    const yScale = scaleLinear()
      .domain([0, yMaxWithDiff])
      .range([innerHeight, 0]);

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

    const gridAxis = axisLeft(yScale)
      .ticks(5)
      .tickSize(-innerWidth)
      .tickFormat(() => "");

    const gridGroup = chartGroup.append("g").call(gridAxis);
    gridGroup.selectAll("line").attr("stroke", colors.grid);
    gridGroup.selectAll(".domain").remove();

    const xAxis = axisBottom(xScale)
      .tickValues(tickValues)
      .tickFormat((value) => {
        const monthValue = value as number;
        if (monthValue >= 12) {
          return formatYears(monthValue);
        }
        return `${monthValue}ヶ月`;
      });

    const yAxis = axisLeft(yScale)
      .ticks(5)
      .tickFormat(
        (value) => `${format(",")((value as number) / 10000)}万円`,
      );

    chartGroup
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll("text")
      .attr("fill", colors.axis)
      .attr("font-size", 11);

    chartGroup
      .append("g")
      .call(yAxis)
      .selectAll("text")
      .attr("fill", colors.axis)
      .attr("font-size", 11);

    chartGroup.selectAll("path.domain").attr("stroke", colors.axis);

    scenarioData.forEach((scenario) => {
      if (!visibleSeries[`${scenario.id}:balance`]) {
        return;
      }
      const balanceLine = line<Row>()
        .x((row) => xScale(row.month))
        .y((row) => yScale(row.balance));

      chartGroup
        .append("path")
        .datum(scenario.schedule)
        .attr("fill", "none")
        .attr("stroke", scenario.color)
        .attr("stroke-width", scenario.id === selectedScenario.id ? 2.8 : 2)
        .attr("d", balanceLine);
    });

    scenarioData.forEach((scenario) => {
      const highlight = scenario.id === selectedScenario.id;

      if (visibleSeries[`${scenario.id}:principal`]) {
        const principalLine = line<Row>()
          .x((row) => xScale(row.month))
          .y((row) => yScale(row.principal));

        chartGroup
          .append("path")
          .datum(scenario.schedule)
          .attr("fill", "none")
          .attr("stroke", scenario.color)
          .attr("stroke-width", highlight ? 2.2 : 1.6)
          .attr("stroke-dasharray", "18 6")
          .attr("stroke-linecap", "round")
          .attr("d", principalLine);
      }

      if (visibleSeries[`${scenario.id}:gain`]) {
        const gainLine = line<Row>()
          .x((row) => xScale(row.month))
          .y((row) => yScale(row.gain));

        chartGroup
          .append("path")
          .datum(scenario.schedule)
          .attr("fill", "none")
          .attr("stroke", scenario.color)
          .attr("stroke-width", highlight ? 2.2 : 1.6)
          .attr("stroke-dasharray", "2 6")
          .attr("stroke-linecap", "round")
          .attr("d", gainLine);
      }

      if (visibleSeries[`${scenario.id}:gainDiff`]) {
        const gainDiffLine = line<TableRow>()
          .x((row) => xScale(row.month))
          .y((row) => yScale(row.gainDiff));

        chartGroup
          .append("path")
          .datum(scenario.tableRows)
          .attr("fill", "none")
          .attr("stroke", scenario.color)
          .attr("stroke-width", highlight ? 2.1 : 1.5)
          .attr("stroke-dasharray", "6 2 1 2")
          .attr("stroke-linecap", "round")
          .attr("d", gainDiffLine);
      }
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
      .attr("stroke", "#ffffff")
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

  }, [scenarioData, selectedScenario, tableRows, visibleSeries]);

  return (
    <main className="flex flex-col w-full max-w-5xl mx-auto px-4 pb-16">
      <h1 className="mb-6 text-3xl">資産形成シミュレーション</h1>
      <p className="mb-4 text-sm text-foreground/80">
        毎月末に積立て、年平均利回りは実効年利として月利へ換算し、複数パターンを同一条件で複利計算します。税金や手数料は考慮していません。
      </p>
      <p className="mb-2 text-xs text-foreground/70">
        ※ 本シミュレーションは実際の値動きを反映したものではありません。
      </p>
      <p className="mb-2 text-xs text-foreground/70">
        ※ 本ツールは情報提供を目的としたもので、投資助言・勧誘を意図するものではありません。最終的な投資判断はご自身の責任で行ってください。
      </p>
      <p className="mb-6 text-xs text-foreground/70">
        ※ 情報の正確性には配慮していますが、その完全性・最新性を保証するものではありません。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <label className="flex flex-col gap-2">
          <span className="text-sm">積立て期間（年）</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            step={1}
            value={yearsInput}
            onChange={(event) => {
              setYearsInput(event.target.value);
            }}
            className="w-full p-2 border rounded-md"
            style={inputStyle}
          />
        </label>
      </div>

      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-foreground/80">
            積立てパターン
          </h2>
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={() => {
              syncScenarios((prev) => {
                const nextIndex = prev.length + 1;
                return [
                  ...prev,
                  {
                    id: `scenario-${nextIndex}`,
                    name: `パターン${nextIndex}`,
                    monthlyContributionInput: "30000",
                    annualRateInput: "5",
                  },
                ];
              });
            }}
          >
            パターンを追加
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarioList.map((scenario, index) => (
            <div
              key={scenario.id}
              className="border rounded-md p-4 space-y-3"
              style={{ backgroundColor: "var(--card-bg)" }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">
                  パターン{index + 1}
                </div>
                {scenarioList.length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => {
                      syncScenarios((prev) =>
                        prev.filter((item) => item.id !== scenario.id),
                      );
                    }}
                  >
                    削除
                  </button>
                )}
              </div>
              <label className="flex flex-col gap-2">
                <span className="text-xs">パターン名</span>
                <input
                  type="text"
                  value={scenario.name}
                  onChange={(event) => {
                    const value = event.target.value;
                    syncScenarios((prev) =>
                      prev.map((item) =>
                        item.id === scenario.id ? { ...item, name: value } : item,
                      ),
                    );
                  }}
                  className="w-full p-2 border rounded-md"
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs">毎月の積立て金額（円）</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1000}
                  value={scenario.monthlyContributionInput}
                  onChange={(event) => {
                    const value = event.target.value;
                    syncScenarios((prev) =>
                      prev.map((item) =>
                        item.id === scenario.id
                          ? { ...item, monthlyContributionInput: value }
                          : item,
                      ),
                    );
                  }}
                  className="w-full p-2 border rounded-md"
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs">年平均利回り（%）</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={0.1}
                  value={scenario.annualRateInput}
                  onChange={(event) => {
                    const value = event.target.value;
                    syncScenarios((prev) =>
                      prev.map((item) =>
                        item.id === scenario.id
                          ? { ...item, annualRateInput: value }
                          : item,
                      ),
                    );
                  }}
                  className="w-full p-2 border rounded-md"
                  style={inputStyle}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div
          className="p-4 border rounded-md"
          style={{ backgroundColor: "var(--card-bg)" }}
        >
          <p className="text-xs text-foreground/60 mb-1">元本合計</p>
          <p className="text-xl font-semibold">
            {formatYenWithMan(summary.principal)}
          </p>
        </div>
        <div
          className="p-4 border rounded-md"
          style={{ backgroundColor: "var(--card-bg)" }}
        >
          <p className="text-xs text-foreground/60 mb-1">運用益</p>
          <p className="text-xl font-semibold">
            {formatYenWithMan(summary.gain)}
          </p>
        </div>
        <div
          className="p-4 border rounded-md"
          style={{ backgroundColor: "var(--card-bg)" }}
        >
          <p className="text-xs text-foreground/60 mb-1">評価額</p>
          <p className="text-xl font-semibold">
            {formatYenWithMan(summary.balance)}
          </p>
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className="mb-8 border rounded-md p-4 relative"
        style={{ backgroundColor: "var(--card-bg)" }}
      >
        <div className="text-sm mb-3 text-foreground/70">推移グラフ</div>
        <svg ref={chartRef} className="w-full h-auto" />
        <div className="mt-4 grid gap-4 text-xs text-foreground/70 md:grid-cols-2">
          {scenarioData.map((scenario) => (
            <div key={scenario.id} className="space-y-2">
              <button
                type="button"
                className="flex items-center gap-2 text-left text-foreground/80"
                onClick={() => {
                  const keys = [
                    `${scenario.id}:balance`,
                    `${scenario.id}:principal`,
                    `${scenario.id}:gain`,
                    `${scenario.id}:gainDiff`,
                  ];
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
              <button
                type="button"
                className="flex items-center gap-2 text-left"
                onClick={() =>
                  setVisibleSeries((prev) => ({
                    ...prev,
                    [`${scenario.id}:balance`]:
                      !prev[`${scenario.id}:balance`],
                  }))
                }
                aria-pressed={!!visibleSeries[`${scenario.id}:balance`]}
              >
                <svg width="18" height="6" viewBox="0 0 18 6">
                  <line
                    x1="0"
                    y1="3"
                    x2="18"
                    y2="3"
                    stroke={scenario.color}
                    strokeWidth="2"
                  />
                </svg>
                <span
                  className={
                    visibleSeries[`${scenario.id}:balance`]
                      ? ""
                      : "opacity-40"
                  }
                >
                  評価額
                </span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 text-left"
                onClick={() =>
                  setVisibleSeries((prev) => ({
                    ...prev,
                    [`${scenario.id}:principal`]:
                      !prev[`${scenario.id}:principal`],
                  }))
                }
                aria-pressed={!!visibleSeries[`${scenario.id}:principal`]}
              >
                <svg width="18" height="6" viewBox="0 0 18 6">
                  <line
                    x1="0"
                    y1="3"
                    x2="18"
                    y2="3"
                    stroke={scenario.color}
                    strokeWidth="2"
                    strokeDasharray="18 6"
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  className={
                    visibleSeries[`${scenario.id}:principal`]
                      ? ""
                      : "opacity-40"
                  }
                >
                  元本
                </span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 text-left"
                onClick={() =>
                  setVisibleSeries((prev) => ({
                    ...prev,
                    [`${scenario.id}:gain`]: !prev[`${scenario.id}:gain`],
                  }))
                }
                aria-pressed={!!visibleSeries[`${scenario.id}:gain`]}
              >
                <svg width="18" height="6" viewBox="0 0 18 6">
                  <line
                    x1="0"
                    y1="3"
                    x2="18"
                    y2="3"
                    stroke={scenario.color}
                    strokeWidth="2"
                    strokeDasharray="2 6"
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  className={
                    visibleSeries[`${scenario.id}:gain`] ? "" : "opacity-40"
                  }
                >
                  運用益
                </span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 text-left"
                onClick={() =>
                  setVisibleSeries((prev) => ({
                    ...prev,
                    [`${scenario.id}:gainDiff`]:
                      !prev[`${scenario.id}:gainDiff`],
                  }))
                }
                aria-pressed={!!visibleSeries[`${scenario.id}:gainDiff`]}
              >
                <svg width="18" height="6" viewBox="0 0 18 6">
                  <line
                    x1="0"
                    y1="3"
                    x2="18"
                    y2="3"
                    stroke={scenario.color}
                    strokeWidth="2"
                    strokeDasharray="6 2 1 2"
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  className={
                    visibleSeries[`${scenario.id}:gainDiff`]
                      ? ""
                      : "opacity-40"
                  }
                >
                  前年差
                </span>
              </button>
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
                const maxLeft =
                  container.clientWidth - tooltipSize.width - 8;
                return Math.max(8, Math.min(tooltip.x + 12, maxLeft));
              })(),
              top: (() => {
                const container = chartContainerRef.current;
                if (!container) {
                  return tooltip.y + 12;
                }
                const maxTop =
                  container.clientHeight - tooltipSize.height - 8;
                return Math.max(8, Math.min(tooltip.y + 12, maxTop));
              })(),
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--foreground)",
            }}
          >
            <div className="mb-1">
              {tooltip.label}・{formatYears(tooltip.row.month)}
            </div>
            <div>元本: {numberFormatter.format(Math.round(tooltip.row.principal))} 円</div>
            <div>運用益: {numberFormatter.format(Math.round(tooltip.row.gain))} 円</div>
            <div>評価額: {numberFormatter.format(Math.round(tooltip.row.balance))} 円</div>
            <div>
              前年差: {numberFormatter.format(Math.round(tooltip.row.gainDiff))} 円
            </div>
          </div>
        )}
      </div>
      <div className="mb-10 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-black text-white hover:bg-black/90"
          onClick={() => {
            const url = window.location.href;
            const text = "資産形成シミュレーションの結果を共有します。";
            const shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
              text,
            )}&url=${encodeURIComponent(url)}`;
            window.open(shareUrl, "_blank", "noopener,noreferrer");
          }}
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.963 6.817H1.68l7.73-8.84L1.25 2.25h6.828l4.713 6.231 5.454-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
          </svg>
          ポスト
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="mb-3 flex items-center gap-2 text-sm">
          <label className="text-foreground/70">表示パターン</label>
          <select
            className="border rounded-md px-2 py-1"
            style={inputStyle}
            value={selectedScenarioId}
            onChange={(event) => setSelectedScenarioId(event.target.value)}
          >
            {scenarioData.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.label}
              </option>
            ))}
          </select>
        </div>
        <table className="w-full text-sm border border-collapse">
          <thead>
            <tr className="bg-foreground/5">
              <th className="border px-3 py-2 text-left">年数</th>
              <th className="border px-3 py-2 text-right">元本（累計）</th>
              <th className="border px-3 py-2 text-right">運用益</th>
              <th className="border px-3 py-2 text-right">前年差（運用益）</th>
              <th className="border px-3 py-2 text-right">評価額</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={row.month}>
                <td className="border px-3 py-2">{formatYears(row.month)}</td>
                <td className="border px-3 py-2 text-right">
                  {numberFormatter.format(Math.round(row.principal))}
                </td>
                <td className="border px-3 py-2 text-right">
                  {numberFormatter.format(Math.round(row.gain))}
                </td>
                <td className="border px-3 py-2 text-right">
                  {numberFormatter.format(Math.round(row.gainDiff))}
                </td>
                <td className="border px-3 py-2 text-right">
                  {numberFormatter.format(Math.round(row.balance))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
