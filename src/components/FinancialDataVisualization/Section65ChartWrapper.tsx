"use client";

import { LineChart } from "@/components/Charts";
import section65Data from "@/contents/blog/2025-12-26-kakekin/data/section65.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section65ChartWrapper: React.FC = () => {
  if (!section65Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section65Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section65Data)}
    />
  );
};
