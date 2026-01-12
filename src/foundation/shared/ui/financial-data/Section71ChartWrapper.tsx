"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section71Data from "@/content/blog/2026-01-01-kakekin/data/section71.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

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
