"use client";

import { LineChart } from "@/components/Charts";
import section49Data from "@/contents/blog/2025-12-26-kakekin/data/section49.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section49ChartWrapper: React.FC = () => {
  if (!section49Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section49Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section49Data)}
    />
  );
};
