"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section69Data from "@/content/blog/2026-01-01-kakekin/data/section69.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section69ChartWrapper: React.FC = () => {
  if (!section69Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section69Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section69Data)}
    />
  );
};
