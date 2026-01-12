"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section43Data from "@/content/blog/2026-01-01-kakekin/data/section43.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section43ChartWrapper: React.FC = () => {
  if (!section43Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section43Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section43Data)}
    />
  );
};
