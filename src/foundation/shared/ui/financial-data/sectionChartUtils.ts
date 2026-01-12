"use client";

import type { ChartConfig, SheetData } from "@/shared/ui/financial-charts";

const UNIT_PRIORITY = ["％", "%", "万円", "円", "歳", "人", "件"] as const;

const normalizeUnit = (unit: string) => (unit === "%" ? "％" : unit);

const extractUnit = (header: string): string | null => {
  const parts = header.split("|").map((part) => part.trim());
  const candidate = parts[parts.length - 1];
  if (!candidate) {
    return null;
  }
  if (UNIT_PRIORITY.includes(candidate as (typeof UNIT_PRIORITY)[number])) {
    return normalizeUnit(candidate);
  }
  return null;
};

const selectUnit = (headers: string[]): string => {
  const counts = new Map<string, number>();
  headers.forEach((header) => {
    const unit = extractUnit(header);
    if (!unit) return;
    counts.set(unit, (counts.get(unit) ?? 0) + 1);
  });
  let selected = "％";
  let maxCount = -1;
  counts.forEach((count, unit) => {
    if (count > maxCount) {
      maxCount = count;
      selected = unit;
    }
  });
  return selected;
};

const computeMaxValue = (data: SheetData, unit: string) => {
  let max = 0;
  data.headers.forEach((header) => {
    const headerUnit = extractUnit(header);
    if (headerUnit && headerUnit !== unit) return;
    data.series.forEach((row) => {
      const value = row.values[header];
      if (typeof value === "number" && value > max) {
        max = value;
      }
    });
  });
  return max;
};

const roundUp = (value: number, step: number) => Math.ceil(value / step) * step;

export const buildAutoChartConfig = (data: SheetData): ChartConfig => {
  const unit = selectUnit(data.headers);
  const startYear = Math.min(
    ...data.series.map((s) => Number(s.year)).filter((n) => Number.isFinite(n)),
  );
  const maxValue = computeMaxValue(data, unit);

  let yAxisMax = 100;
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
