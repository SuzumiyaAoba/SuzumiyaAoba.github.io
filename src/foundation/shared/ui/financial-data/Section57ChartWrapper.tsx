"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section57Data from "@/content/blog/2026-01-01-kakekin/data/section57.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section57ChartWrapper: React.FC = () => {
  if (!section57Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section57Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section57Data)}
    />
  );
};
