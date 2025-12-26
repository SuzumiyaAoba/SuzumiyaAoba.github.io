"use client";

import { LineChart } from "@/components/Charts";
import section71Data from "@/contents/blog/2025-12-26-kakekin/data/section71.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section71ChartWrapper: React.FC = () => {
  if (!section71Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section71Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section71Data)}
    />
  );
};
