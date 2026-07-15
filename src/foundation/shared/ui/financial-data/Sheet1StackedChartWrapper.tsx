"use client";

import { Sheet1StackedChart } from "./Sheet1StackedChart";
import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";
import { NoDataFallback } from "./_shared/no-data-fallback";
import { parseSheetData } from "./_shared/parse-sheet-data";

export const Sheet1StackedChartWrapper: React.FC = () => {
  const sheet1Data = parseSheetData(assetsData, "1");

  if (!sheet1Data) {
    return <NoDataFallback />;
  }

  return <Sheet1StackedChart data={sheet1Data} />;
};
