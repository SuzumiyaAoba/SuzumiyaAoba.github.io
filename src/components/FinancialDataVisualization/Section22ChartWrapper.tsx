"use client";

import { LineChart } from "@/components/Charts";
import section22Data from "@/contents/blog/2025-12-26-kakekin/data/section22.json";

export const Section22ChartWrapper: React.FC = () => {
  if (!section22Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "積極的に保有しようと思っている | ％": "積極的に保有",
    "一部は保有しようと思っている | ％": "一部は保有",
    "保有しようとは全く思わない | ％": "全く思わない"
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
        labelMap
      }}
    />
  );
};
