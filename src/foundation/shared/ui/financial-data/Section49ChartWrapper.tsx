"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section49Data from "@/content/blog/2026-01-01-kakekin/data/section49.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section49ChartWrapper: React.FC = () => {
  if (!section49Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section49Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section49Data)}
    />
  );
};
