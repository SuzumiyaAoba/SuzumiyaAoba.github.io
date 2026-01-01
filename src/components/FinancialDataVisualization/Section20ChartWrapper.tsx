"use client";

import { LineChart } from "@/components/Charts";
import section20Data from "@/contents/blog/2025-12-26-kakekin/data/section20.json";

export const Section20ChartWrapper: React.FC = () => {
  if (!section20Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "200万円未満 | ％": "200万円未満",
    "200～300万円未満 | ％": "200～300万円",
    "300～500万円未満 | ％": "300～500万円",
    "500～700万円未満 | ％": "500～700万円",
    "700～1000万円未満 | ％": "700～1000万円",
    "1000～1500万円未満 | ％": "1000～1500万円",
    "1500～2000万円未満 | ％": "1500～2000万円",
    "2000～3000万円未満 | ％": "2000～3000万円",
    "3000～5000万円未満 | ％": "3000～5000万円",
    "5000～7000万円未満 | ％": "5000～7000万円",
    "7000万円以上 | ％": "7000万円以上"
  };

  return (
    <LineChart
      data={section20Data}
      groups={[]}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 70,
        yAxisLabel: "％",
        startYear: 1963,
        labelMap
      }}
    />
  );
};
