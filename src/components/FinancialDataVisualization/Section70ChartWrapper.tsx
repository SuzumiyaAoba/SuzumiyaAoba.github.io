"use client";

import { LineChart } from "@/components/Charts";
import section70Data from "@/contents/blog/2026-01-01-kakekin/data/section70.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section70ChartWrapper: React.FC = () => {
  if (!section70Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section70Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section70Data)}
    />
  );
};
