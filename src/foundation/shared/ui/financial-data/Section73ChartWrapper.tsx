"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section73Data from "@/content/blog/2026-01-01-kakekin/data/section73.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section73ChartWrapper: React.FC = () => {
  if (!section73Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section73Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section73Data)}
    />
  );
};
