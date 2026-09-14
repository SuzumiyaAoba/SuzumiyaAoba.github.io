"use client";

import { Sheet1StackedChart } from "./Sheet1StackedChart";
import { NoDataFallback } from "./_shared/no-data-fallback";
import { getAssetSheet } from "./_shared/asset-sheets";

export const Sheet1StackedChartWrapper: React.FC = () => {
  const sheet1Data = getAssetSheet("1");

  if (!sheet1Data) {
    return <NoDataFallback />;
  }

  return <Sheet1StackedChart data={sheet1Data} />;
};
