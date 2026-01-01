"use client";

import { LineChart } from "@/components/Charts";
import section55Data from "@/contents/blog/2025-12-26-kakekin/data/section55.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section55ChartWrapper: React.FC = () => {
  if (!section55Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section55Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section55Data)}
    />
  );
};
