"use client";

import { LineChart } from "@/components/Charts";
import section66Data from "@/contents/blog/2025-12-26-kakekin/data/section66.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section66ChartWrapper: React.FC = () => {
  if (!section66Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section66Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section66Data)}
    />
  );
};
