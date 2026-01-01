"use client";

import { LineChart } from "@/components/Charts";
import section69Data from "@/contents/blog/2025-12-26-kakekin/data/section69.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section69ChartWrapper: React.FC = () => {
  if (!section69Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section69Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section69Data)}
    />
  );
};
