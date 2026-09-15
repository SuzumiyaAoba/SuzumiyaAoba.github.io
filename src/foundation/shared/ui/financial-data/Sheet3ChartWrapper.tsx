"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import { NoDataFallback } from "./_shared/no-data-fallback";
import { getAssetSheet } from "./_shared/asset-sheets";
import {
  SHEET3_EXCLUDE_HEADERS as excludeHeaders,
  SHEET3_LABEL_MAP as labelMap,
} from "./_shared/sheet3-asset-labels";
import { computeMaxValueForMetrics, roundUpToStep } from "./sectionChartUtils";

export const Sheet3ChartWrapper: React.FC = () => {
  const sheet3Data = getAssetSheet("3");

  if (!sheet3Data) {
    return <NoDataFallback />;
  }

  // パーセンテージデータのみを抽出（平均・中央値以外）
  const percentageMetrics = sheet3Data.headers.filter(
    (header) =>
      !excludeHeaders.includes(header) &&
      sheet3Data.series.some((s) => s.values[header] !== null)
  );

  // Y軸の最大値を計算(5の倍数に切り上げ)
  const yAxisMax = roundUpToStep(
    computeMaxValueForMetrics(sheet3Data, percentageMetrics),
    5
  );

  return (
    <LineChart
      data={sheet3Data}
      groups={[]}
      excludeHeaders={excludeHeaders}
      config={{
        yAxisMin: 0,
        yAxisMax,
        yAxisLabel: "%",
        startYear: 1963,
        labelMap,
      }}
    />
  );
};
