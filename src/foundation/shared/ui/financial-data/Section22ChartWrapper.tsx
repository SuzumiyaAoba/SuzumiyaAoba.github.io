"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section22Data from "@/content/blog/2026-01-01-kakekin/data/section22.json";

export const Section22ChartWrapper: React.FC = () => {
  if (!section22Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "積極的に保有しようと思っている | ％": "積極的に保有",
    "一部は保有しようと思っている | ％": "一部は保有",
    "保有しようとは全く思わない | ％": "全く思わない",
  };

  return (
    <LineChart
      data={section22Data}
      groups={[]}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 90,
        yAxisLabel: "％",
        startYear: 2007,
        labelMap,
      }}
    />
  );
};
