"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section55Data from "@/content/blog/2026-01-01-kakekin/data/section55.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section55ChartWrapper: React.FC = () => {
  if (!section55Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section55Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section55Data)}
    />
  );
};
