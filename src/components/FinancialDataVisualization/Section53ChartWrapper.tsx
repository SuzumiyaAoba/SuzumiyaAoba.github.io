"use client";

import { LineChart } from "@/components/Charts";
import section53Data from "@/contents/blog/2025-12-26-kakekin/data/section53.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section53ChartWrapper: React.FC = () => {
  if (!section53Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section53Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section53Data)}
    />
  );
};
