"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section54Data from "@/content/blog/2026-01-01-kakekin/data/section54.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section54ChartWrapper: React.FC = () => {
  if (!section54Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section54Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section54Data)}
    />
  );
};
