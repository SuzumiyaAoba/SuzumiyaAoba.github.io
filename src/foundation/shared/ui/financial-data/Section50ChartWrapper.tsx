"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section50Data from "@/content/blog/2026-01-01-kakekin/data/section50.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section50ChartWrapper: React.FC = () => {
  if (!section50Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section50Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section50Data)}
    />
  );
};
