"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section52Data from "@/content/blog/2026-01-01-kakekin/data/section52.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section52ChartWrapper: React.FC = () => {
  if (!section52Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section52Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section52Data)}
    />
  );
};
