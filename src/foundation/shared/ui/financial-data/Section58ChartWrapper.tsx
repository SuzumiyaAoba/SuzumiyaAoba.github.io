"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section58Data from "@/content/blog/2026-01-01-kakekin/data/section58.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section58ChartWrapper: React.FC = () => {
  if (!section58Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section58Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section58Data)}
    />
  );
};
