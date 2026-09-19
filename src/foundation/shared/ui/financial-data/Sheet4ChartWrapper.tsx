"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import { NoDataFallback } from "./_shared/no-data-fallback";
import { getAssetSheet } from "./_shared/asset-sheets";
import {
  SHEET4_EXCLUDE_HEADERS as excludeHeaders,
  SHEET4_LABEL_MAP as labelMap,
} from "./_shared/sheet4-asset-labels";
import { computeMaxValueForMetrics, roundUpToStep } from "./sectionChartUtils";

export const Sheet4ChartWrapper: React.FC = () => {
  const sheet4Data = getAssetSheet("4");

  if (!sheet4Data) {
    return <NoDataFallback />;
  }

  // パーセンテージデータのみを抽出（平均・中央値以外）
  const excludeSet = new Set(excludeHeaders);
  const percentageMetrics = sheet4Data.headers.filter(
    (header) =>
      !excludeSet.has(header) &&
      sheet4Data.series.some((s) => s.values[header] !== null)
  );

  // Y軸の最大値を計算(5の倍数に切り上げ)
  const yAxisMax = roundUpToStep(
    computeMaxValueForMetrics(sheet4Data, percentageMetrics),
    5
  );

  return (
    <LineChart
      data={sheet4Data}
      groups={[]}
      excludeHeaders={excludeHeaders}
      config={{
        yAxisMin: 0,
        yAxisMax,
        yAxisLabel: "%",
        startYear: 2004,
        labelMap,
      }}
    />
  );
};
