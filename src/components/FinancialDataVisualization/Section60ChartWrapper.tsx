"use client";

import { LineChart } from "@/components/Charts";
import section60Data from "@/contents/blog/2025-12-26-kakekin/data/section60.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section60ChartWrapper: React.FC = () => {
  if (!section60Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section60Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section60Data)}
    />
  );
};
