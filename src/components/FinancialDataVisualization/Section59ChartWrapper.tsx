"use client";

import { LineChart } from "@/components/Charts";
import section59Data from "@/contents/blog/2025-12-26-kakekin/data/section59.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section59ChartWrapper: React.FC = () => {
  if (!section59Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section59Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section59Data)}
    />
  );
};
