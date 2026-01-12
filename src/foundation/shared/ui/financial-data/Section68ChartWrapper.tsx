"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section68Data from "@/content/blog/2026-01-01-kakekin/data/section68.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section68ChartWrapper: React.FC = () => {
  if (!section68Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section68Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section68Data)}
    />
  );
};
