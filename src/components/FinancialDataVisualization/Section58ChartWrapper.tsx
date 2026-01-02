"use client";

import { LineChart } from "@/components/Charts";
import section58Data from "@/contents/blog/2026-01-01-kakekin/data/section58.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section58ChartWrapper: React.FC = () => {
  if (!section58Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section58Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section58Data)}
    />
  );
};
