"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section66Data from "@/content/blog/2026-01-01-kakekin/data/section66.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section66ChartWrapper: React.FC = () => {
  if (!section66Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section66Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section66Data)}
    />
  );
};
