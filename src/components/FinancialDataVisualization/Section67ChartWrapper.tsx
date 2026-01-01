"use client";

import { LineChart } from "@/components/Charts";
import section67Data from "@/contents/blog/2025-12-26-kakekin/data/section67.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section67ChartWrapper: React.FC = () => {
  if (!section67Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <LineChart
      data={section67Data}
      groups={[]}
      excludeHeaders={[]}
      config={buildAutoChartConfig(section67Data)}
    />
  );
};
