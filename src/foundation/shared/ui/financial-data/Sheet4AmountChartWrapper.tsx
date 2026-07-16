"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";
import { NoDataFallback } from "./_shared/no-data-fallback";
import { parseSheetData } from "./_shared/parse-sheet-data";
import { computeMaxValueForMetrics, roundUpToStep } from "./sectionChartUtils";

export const Sheet4AmountChartWrapper: React.FC = () => {
  const sheet4Data = parseSheetData(assetsData, "4");

  if (!sheet4Data) {
    return <NoDataFallback />;
  }

  // パーセンテージデータをすべて除外し、平均と中央値のみを表示
  const excludeHeaders = sheet4Data.headers.filter((header) => {
    // 平均と中央値以外をすべて除外
    return header !== "平均 | 万円" && header !== "中央値 | 万円";
  });

  // 万円データのみを抽出（平均と中央値）
  const amountMetrics = ["平均 | 万円", "中央値 | 万円"].filter((header) =>
    sheet4Data.series.some((s) => s.values[header] !== null),
  );

  // Y軸の最大値を計算(500の倍数に切り上げ)
  const yAxisMax = roundUpToStep(computeMaxValueForMetrics(sheet4Data, amountMetrics), 500);

  // ラベルマッピング
  const labelMap: Record<string, string> = {
    "平均 | 万円": "平均",
    "中央値 | 万円": "中央値",
  };

  return (
    <LineChart
      data={sheet4Data}
      groups={[]}
      excludeHeaders={excludeHeaders}
      config={{
        yAxisMin: 0,
        yAxisMax: yAxisMax,
        yAxisLabel: "万円",
        startYear: 2004,
        labelMap,
      }}
    />
  );
};
