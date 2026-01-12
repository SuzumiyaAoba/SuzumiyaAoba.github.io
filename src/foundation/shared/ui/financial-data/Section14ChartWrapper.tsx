"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section14Data from "@/content/blog/2026-01-01-kakekin/data/section14.json";

export const Section14ChartWrapper: React.FC = () => {
  if (!section14Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "増えた | ％": "増えた",
    "変わらない | ％": "変わらない",
    "減った | ％": "減った",
  };

  return (
    <LineChart
      data={section14Data}
      groups={[]}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 60,
        yAxisLabel: "％",
        startYear: 2007,
        labelMap,
      }}
    />
  );
};
