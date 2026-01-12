"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section45Data from "@/content/blog/2026-01-01-kakekin/data/section45.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section45ChartWrapper: React.FC = () => {
  if (!section45Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section45Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section45Data)}
    />
  );
};
