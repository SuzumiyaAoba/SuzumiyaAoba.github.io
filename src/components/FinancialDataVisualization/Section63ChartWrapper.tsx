"use client";

import { LineChart } from "@/components/Charts";
import section63Data from "@/contents/blog/2026-01-01-kakekin/data/section63.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section63ChartWrapper: React.FC = () => {
  if (!section63Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section63Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section63Data)}
    />
  );
};
