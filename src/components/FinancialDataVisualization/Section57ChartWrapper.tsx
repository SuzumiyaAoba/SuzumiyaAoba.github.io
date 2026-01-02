"use client";

import { LineChart } from "@/components/Charts";
import section57Data from "@/contents/blog/2026-01-01-kakekin/data/section57.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section57ChartWrapper: React.FC = () => {
  if (!section57Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section57Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section57Data)}
    />
  );
};
