"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section62Data from "@/content/blog/2026-01-01-kakekin/data/section62.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section62ChartWrapper: React.FC = () => {
  if (!section62Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section62Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section62Data)}
    />
  );
};
