"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section67Data from "@/content/blog/2026-01-01-kakekin/data/section67.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

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
