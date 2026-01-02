"use client";

import { LineChart } from "@/components/Charts";
import section56Data from "@/contents/blog/2026-01-01-kakekin/data/section56.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section56ChartWrapper: React.FC = () => {
  if (!section56Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section56Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section56Data)}
    />
  );
};
