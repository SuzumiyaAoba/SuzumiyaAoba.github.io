"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section48Data from "@/content/blog/2026-01-01-kakekin/data/section48.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section48ChartWrapper: React.FC = () => {
  if (!section48Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section48Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section48Data)}
    />
  );
};
