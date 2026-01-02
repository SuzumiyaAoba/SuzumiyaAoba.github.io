"use client";

import { LineChart } from "@/components/Charts";
import section27Data from "@/contents/blog/2026-01-01-kakekin/data/section27.json";

export const Section27ChartWrapper: React.FC = () => {
  if (!section27Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "借入金がある | ％": "借入金がある",
    "借入金がない | ％": "借入金がない"
  };

  return (
    <LineChart
      data={section27Data}
      groups={[]}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 100,
        yAxisLabel: "％",
        startYear: 1967,
        labelMap
      }}
    />
  );
};
