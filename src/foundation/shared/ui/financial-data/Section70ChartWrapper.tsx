"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section70Data from "@/content/blog/2026-01-01-kakekin/data/section70.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section70ChartWrapper: React.FC = () => {
  if (!section70Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section70Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section70Data)}
    />
  );
};
