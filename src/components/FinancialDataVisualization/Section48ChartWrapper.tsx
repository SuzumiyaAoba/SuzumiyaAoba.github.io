"use client";

import { LineChart } from "@/components/Charts";
import section48Data from "@/contents/blog/2025-12-26-kakekin/data/section48.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section48ChartWrapper: React.FC = () => {
  if (!section48Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section48Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section48Data)}
    />
  );
};
