"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section56Data from "@/content/blog/2026-01-01-kakekin/data/section56.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section56ChartWrapper: React.FC = () => {
  if (!section56Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section56Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section56Data)}
    />
  );
};
