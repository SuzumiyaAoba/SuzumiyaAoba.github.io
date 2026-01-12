"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section47Data from "@/content/blog/2026-01-01-kakekin/data/section47.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

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
