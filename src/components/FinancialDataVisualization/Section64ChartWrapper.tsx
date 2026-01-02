"use client";

import { LineChart } from "@/components/Charts";
import section64Data from "@/contents/blog/2026-01-01-kakekin/data/section64.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section64ChartWrapper: React.FC = () => {
  if (!section64Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section64Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section64Data)}
    />
  );
};
