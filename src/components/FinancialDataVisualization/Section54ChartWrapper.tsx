"use client";

import { LineChart } from "@/components/Charts";
import section54Data from "@/contents/blog/2025-12-26-kakekin/data/section54.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section54ChartWrapper: React.FC = () => {
  if (!section54Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section54Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section54Data)}
    />
  );
};
