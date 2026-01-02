"use client";

import { LineChart } from "@/components/Charts";
import section52Data from "@/contents/blog/2026-01-01-kakekin/data/section52.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section52ChartWrapper: React.FC = () => {
  if (!section52Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section52Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section52Data)}
    />
  );
};
