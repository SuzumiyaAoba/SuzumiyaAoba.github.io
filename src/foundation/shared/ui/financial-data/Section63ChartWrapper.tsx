"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section63Data from "@/content/blog/2026-01-01-kakekin/data/section63.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section63ChartWrapper: React.FC = () => {
  if (!section63Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section63Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section63Data)}
    />
  );
};
