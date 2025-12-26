"use client";

import { LineChart } from "@/components/Charts";
import section74Data from "@/contents/blog/2025-12-26-kakekin/data/section74.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section74ChartWrapper: React.FC = () => {
  if (!section74Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section74Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section74Data)}
    />
  );
};
