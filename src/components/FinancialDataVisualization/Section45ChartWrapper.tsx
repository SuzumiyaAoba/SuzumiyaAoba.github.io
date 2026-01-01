"use client";

import { LineChart } from "@/components/Charts";
import section45Data from "@/contents/blog/2025-12-26-kakekin/data/section45.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section45ChartWrapper: React.FC = () => {
  if (!section45Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section45Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section45Data)}
    />
  );
};
