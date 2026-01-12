"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section53Data from "@/content/blog/2026-01-01-kakekin/data/section53.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section53ChartWrapper: React.FC = () => {
  if (!section53Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section53Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section53Data)}
    />
  );
};
