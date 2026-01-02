"use client";

import { LineChart } from "@/components/Charts";
import section62Data from "@/contents/blog/2026-01-01-kakekin/data/section62.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section62ChartWrapper: React.FC = () => {
  if (!section62Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section62Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section62Data)}
    />
  );
};
