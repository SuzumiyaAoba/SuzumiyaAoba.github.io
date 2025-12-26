"use client";

import { LineChart } from "@/components/Charts";
import section40Data from "@/contents/blog/2025-12-26-kakekin/data/section40.json";

export const Section40ChartWrapper: React.FC = () => {
  if (!section40Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "取得ないし 増改築した | ％": "取得・増改築",
    "売却した | ％": "売却",
    "取得ないし 増改築し、 売却もした | ％": "取得・増改築＋売却",
    "取得、増改築、 売却ともに していない | ％": "いずれもなし"
  };

  return (
    <LineChart
      data={section40Data}
      groups={[]}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 100,
        yAxisLabel: "％",
        startYear: 2007,
        labelMap
      }}
    />
  );
};
