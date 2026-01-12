"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section64Data from "@/content/blog/2026-01-01-kakekin/data/section64.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section64ChartWrapper: React.FC = () => {
  if (!section64Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section64Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section64Data)}
    />
  );
};
