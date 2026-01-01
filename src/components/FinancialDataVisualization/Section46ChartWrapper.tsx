"use client";

import { LineChart } from "@/components/Charts";
import section46Data from "@/contents/blog/2025-12-26-kakekin/data/section46.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section46ChartWrapper: React.FC = () => {
  if (!section46Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section46Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section46Data)}
    />
  );
};
