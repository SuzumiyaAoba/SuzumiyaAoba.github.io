"use client";

import { LineChart } from "@/components/Charts";
import section61Data from "@/contents/blog/2026-01-01-kakekin/data/section61.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section61ChartWrapper: React.FC = () => {
  if (!section61Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section61Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section61Data)}
    />
  );
};
