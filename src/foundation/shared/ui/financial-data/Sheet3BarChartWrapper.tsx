"use client";

import { StackedBarChart } from "@/shared/ui/financial-charts";
import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";
import { NoDataFallback } from "./_shared/no-data-fallback";
import { parseSheetData } from "./_shared/parse-sheet-data";
import { SHEET3_EXCLUDE_HEADERS, SHEET3_LABEL_MAP } from "./_shared/sheet3-asset-labels";

export const Sheet3BarChartWrapper: React.FC = () => {
  const sheet3Data = parseSheetData(assetsData, "3");

  if (!sheet3Data) {
    return <NoDataFallback />;
  }

  return (
    <StackedBarChart
      data={sheet3Data}
      groups={[]}
      excludeHeaders={SHEET3_EXCLUDE_HEADERS}
      config={{
        yAxisMin: 0,
        yAxisMax: 100,
        yAxisLabel: "%",
        startYear: 1963,
        labelMap: SHEET3_LABEL_MAP,
      }}
    />
  );
};
