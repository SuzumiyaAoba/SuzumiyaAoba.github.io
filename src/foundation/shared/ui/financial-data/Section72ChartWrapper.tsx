"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section72Data from "@/content/blog/2026-01-01-kakekin/data/section72.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section72ChartWrapper: React.FC = () => {
  if (!section72Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section72Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section72Data)}
    />
  );
};
