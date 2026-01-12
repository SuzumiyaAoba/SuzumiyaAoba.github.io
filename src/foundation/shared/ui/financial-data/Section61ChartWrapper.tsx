"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section61Data from "@/content/blog/2026-01-01-kakekin/data/section61.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section61ChartWrapper: React.FC = () => {
  if (!section61Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section61Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section61Data)}
    />
  );
};
