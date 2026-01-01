"use client";

import { LineChart } from "@/components/Charts";
import section43Data from "@/contents/blog/2025-12-26-kakekin/data/section43.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section43ChartWrapper: React.FC = () => {
  if (!section43Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section43Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section43Data)}
    />
  );
};
