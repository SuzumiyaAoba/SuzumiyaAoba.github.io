"use client";

import { StackedBarChart } from "@/shared/ui/financial-charts";
import { NoDataFallback } from "./_shared/no-data-fallback";
import { getAssetSheet } from "./_shared/asset-sheets";
import {
  SHEET4_EXCLUDE_HEADERS,
  SHEET4_LABEL_MAP,
} from "./_shared/sheet4-asset-labels";

export const Sheet4BarChartWrapper: React.FC = () => {
  const sheet4Data = getAssetSheet("4");

  if (!sheet4Data) {
    return <NoDataFallback />;
  }

  return (
    <StackedBarChart
      data={sheet4Data}
      groups={[]}
      excludeHeaders={SHEET4_EXCLUDE_HEADERS}
      config={{
        yAxisMin: 0,
        yAxisMax: 100,
        yAxisLabel: "%",
        startYear: 2004,
        labelMap: SHEET4_LABEL_MAP,
      }}
    />
  );
};
