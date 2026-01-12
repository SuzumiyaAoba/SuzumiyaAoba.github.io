"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section59Data from "@/content/blog/2026-01-01-kakekin/data/section59.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section59ChartWrapper: React.FC = () => {
  if (!section59Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section59Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section59Data)}
    />
  );
};
