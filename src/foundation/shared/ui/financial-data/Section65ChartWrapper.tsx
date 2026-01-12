"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section65Data from "@/content/blog/2026-01-01-kakekin/data/section65.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section65ChartWrapper: React.FC = () => {
  if (!section65Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section65Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section65Data)}
    />
  );
};
