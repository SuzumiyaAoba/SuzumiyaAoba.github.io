"use client";

import { LineChart } from "@/components/Charts";
import section72Data from "@/contents/blog/2026-01-01-kakekin/data/section72.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section72ChartWrapper: React.FC = () => {
  if (!section72Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section72Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section72Data)}
    />
  );
};
