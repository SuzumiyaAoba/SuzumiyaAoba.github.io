"use client";

import { LineChart } from "@/components/Charts";
import section68Data from "@/contents/blog/2025-12-26-kakekin/data/section68.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section68ChartWrapper: React.FC = () => {
  if (!section68Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section68Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section68Data)}
    />
  );
};
