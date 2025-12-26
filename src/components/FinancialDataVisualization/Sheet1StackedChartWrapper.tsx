"use client";

import { Sheet1StackedChart } from "./Sheet1StackedChart";
import assetsData from "@/contents/blog/2025-12-26-kakekin/data/assets.json";

export const Sheet1StackedChartWrapper: React.FC = () => {
  const sheet1Data = assetsData.sheets["1"];

  if (!sheet1Data) {
    return <div>データが見つかりません</div>;
  }

  return <Sheet1StackedChart data={sheet1Data} />;
};
