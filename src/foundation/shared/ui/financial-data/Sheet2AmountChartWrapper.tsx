"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";
import { NoDataFallback } from "./_shared/no-data-fallback";
import { parseSheetData } from "./_shared/parse-sheet-data";

export const Sheet2AmountChartWrapper: React.FC = () => {
  const sheet2Data = parseSheetData(assetsData, "2");

  if (!sheet2Data) {
    return <NoDataFallback />;
  }

  const excludeHeaders = ["column_8", "column_9", "column_10", "column_11"];

  const availableMetrics = sheet2Data.headers.filter((header) => {
    return (
      !excludeHeaders.includes(header) && sheet2Data.series.some((s) => s.values[header] !== null)
    );
  });

  // 万円データのみを抽出
  const amountMetrics = availableMetrics.filter((m) => m.includes("万円"));

  // Y軸の最大値を計算
  const maxValue = Math.max(
    ...sheet2Data.series.flatMap((s) => amountMetrics.map((m) => (s.values[m] ?? 0) || 0)),
  );
  const yAxisMax = Math.ceil(maxValue / 100) * 100; // 100の倍数に切り上げ

  return (
    <LineChart
      data={sheet2Data}
      groups={[]}
      excludeHeaders={excludeHeaders}
      config={{
        yAxisMin: 0,
        yAxisMax: yAxisMax,
        yAxisLabel: "万円",
        startYear: 1963,
      }}
    />
  );
};
