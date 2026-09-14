"use client";

import type { ChartConfig, SheetData } from "@/shared/ui/financial-charts";

const UNIT_PRIORITY = new Set<string>(["％", "%", "万円", "円", "歳", "人", "件"]);

const normalizeUnit = (unit: string) => (unit === "%" ? "％" : unit);

const extractUnit = (header: string): string | null => {
  const parts = header.split("|").map((part) => part.trim());
  const candidate = parts.at(-1);
  if (!candidate) {
    return null;
  }
  if (UNIT_PRIORITY.has(candidate)) {
    return normalizeUnit(candidate);
  }
  return null;
};

const selectUnit = (headers: string[]): string => {
  const counts = new Map<string, number>();
  for (const header of headers) {
    const unit = extractUnit(header);
    if (!unit) {
      continue;
    }
    counts.set(unit, (counts.get(unit) ?? 0) + 1);
  }
  let selected = "％";
  let maxCount = -1;
  for (const [unit, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      selected = unit;
    }
  }
  return selected;
};

const computeMaxValue = (data: SheetData, unit: string) => {
  let max = 0;
  for (const header of data.headers) {
    const headerUnit = extractUnit(header);
    if (headerUnit && headerUnit !== unit) {
      continue;
    }
    for (const row of data.series) {
      const value = row.values[header];
      if (typeof value === "number" && value > max) {
        max = value;
      }
    }
  }
  return max;
};

const roundUp = (value: number, step: number) => Math.ceil(value / step) * step;

/**
 * 指定したmetrics(ヘッダー名)群の中での最大値を算出する。
 * Sheet2AmountChartWrapper 等のY軸最大値算出で共通利用する。
 */
export const computeMaxValueForMetrics = (data: SheetData, metrics: string[]): number =>
  Math.max(...data.series.flatMap((s) => metrics.map((m) => (s.values[m] ?? 0) || 0)));

/** stepの倍数に切り上げる */
export const roundUpToStep = roundUp;

export const buildAutoChartConfig = (data: SheetData): ChartConfig => {
  const unit = selectUnit(data.headers);
  const startYear = Math.min(
    ...data.series.map((s) => Number(s.year)).filter((n) => Number.isFinite(n)),
  );
  const maxValue = computeMaxValue(data, unit);

  let yAxisMax: number;
  if (unit === "％") {
    yAxisMax = 100;
  } else if (unit === "万円" || unit === "円") {
    const step = maxValue >= 5000 ? 500 : maxValue >= 1000 ? 200 : 100;
    yAxisMax = Math.max(step, roundUp(maxValue, step));
  } else if (unit === "歳" || unit === "人" || unit === "件") {
    const step = maxValue >= 100 ? 10 : 5;
    yAxisMax = Math.max(step, roundUp(maxValue, step));
  } else {
    yAxisMax = Math.max(10, roundUp(maxValue, 10));
  }

  return {
    yAxisMin: 0,
    yAxisMax,
    yAxisLabel: unit,
    startYear: Number.isFinite(startYear) ? startYear : 2006,
  };
};
