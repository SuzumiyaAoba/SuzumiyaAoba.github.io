"use client";

import { LineChart } from "@/components/Charts";
import section44Data from "@/contents/blog/2025-12-26-kakekin/data/section44.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section44ChartWrapper: React.FC = () => {
  if (!section44Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section44Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section44Data)}
    />
  );
};
