"use client";

import { LineChart } from "@/components/Charts";
import section47Data from "@/contents/blog/2025-12-26-kakekin/data/section47.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section47ChartWrapper: React.FC = () => {
  if (!section47Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section47Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section47Data)}
    />
  );
};
