"use client";

import { LineChart } from "@/components/Charts";
import section50Data from "@/contents/blog/2025-12-26-kakekin/data/section50.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section50ChartWrapper: React.FC = () => {
  if (!section50Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section50Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section50Data)}
    />
  );
};
