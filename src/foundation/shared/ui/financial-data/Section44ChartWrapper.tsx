"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section44Data from "@/content/blog/2026-01-01-kakekin/data/section44.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section44ChartWrapper: React.FC = () => {
  if (!section44Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section44Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section44Data)}
    />
  );
};
