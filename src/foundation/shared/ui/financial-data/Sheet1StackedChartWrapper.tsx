"use client";

import { SheetDataSchema } from "@/shared/ui/financial-charts";
import { Sheet1StackedChart } from "./Sheet1StackedChart";
import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";

export const Sheet1StackedChartWrapper: React.FC = () => {
  const result = SheetDataSchema.safeParse(assetsData.sheets["1"]);
  const sheet1Data = result.success ? result.data : null;

  if (!sheet1Data) {
    return <div>データが見つかりません</div>;
  }

  return <Sheet1StackedChart data={sheet1Data} />;
};
