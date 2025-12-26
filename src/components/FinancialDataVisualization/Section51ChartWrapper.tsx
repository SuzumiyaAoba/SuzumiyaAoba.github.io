"use client";

import { LineChart } from "@/components/Charts";
import section51Data from "@/contents/blog/2025-12-26-kakekin/data/section51.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section51ChartWrapper: React.FC = () => {
  if (!section51Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section51Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section51Data)}
    />
  );
};
