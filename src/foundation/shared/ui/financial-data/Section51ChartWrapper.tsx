"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section51Data from "@/content/blog/2026-01-01-kakekin/data/section51.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section51ChartWrapper: React.FC = () => {
  if (!section51Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section51Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section51Data)}
    />
  );
};
