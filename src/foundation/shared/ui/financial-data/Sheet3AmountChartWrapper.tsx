"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";
import { NoDataFallback } from "./_shared/no-data-fallback";
import { parseSheetData } from "./_shared/parse-sheet-data";
import { computeMaxValueForMetrics, roundUpToStep } from "./sectionChartUtils";

export const Sheet3AmountChartWrapper: React.FC = () => {
  const sheet3Data = parseSheetData(assetsData, "3");

  if (!sheet3Data) {
    return <NoDataFallback />;
  }

  // パーセンテージデータをすべて除外し、平均と中央値のみを表示
  const excludeHeaders = sheet3Data.headers.filter((header) => {
    // 平均と中央値以外をすべて除外
    return header !== "平均 | 万円" && header !== "中央値 | 万円";
  });

  // 万円データのみを抽出（平均と中央値）
  const amountMetrics = ["平均 | 万円", "中央値 | 万円"].filter((header) =>
    sheet3Data.series.some((s) => s.values[header] !== null),
  );

  // Y軸の最大値を計算(500の倍数に切り上げ)
  const yAxisMax = roundUpToStep(computeMaxValueForMetrics(sheet3Data, amountMetrics), 500);

  // ラベルマッピング
  const labelMap: Record<string, string> = {
    "平均 | 万円": "平均",
    "中央値 | 万円": "中央値",
  };

  return (
    <LineChart
      data={sheet3Data}
      groups={[]}
      excludeHeaders={excludeHeaders}
      config={{
        yAxisMin: 0,
        yAxisMax: yAxisMax,
        yAxisLabel: "万円",
        startYear: 1963,
        labelMap,
      }}
    />
  );
};
