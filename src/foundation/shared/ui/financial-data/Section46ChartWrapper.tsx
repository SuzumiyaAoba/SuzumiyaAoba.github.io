"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section46Data from "@/content/blog/2026-01-01-kakekin/data/section46.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section46ChartWrapper: React.FC = () => {
  if (!section46Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section46Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section46Data)}
    />
  );
};
