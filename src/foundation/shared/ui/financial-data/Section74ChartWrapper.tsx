"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section74Data from "@/content/blog/2026-01-01-kakekin/data/section74.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section74ChartWrapper: React.FC = () => {
  if (!section74Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section74Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section74Data)}
    />
  );
};
