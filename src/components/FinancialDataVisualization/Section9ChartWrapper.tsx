"use client";

import { LineChart } from "@/components/Charts";
import section9Data from "@/contents/blog/2026-01-01-kakekin/data/section9.json";

export const Section9ChartWrapper: React.FC = () => {
  if (!section9Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "現金や流動性の高い預貯金から、長期運用型やリスク資産に振り向けた | ％": "リスク資産へ移行",
    "長期運用型やリスク資産から、現金や流動性の高い預貯金に振り向けた | ％": "現金・預貯金へ移行",
    "いずれにもあてはまらない | ％": "変化なし"
  };

  return (
    <LineChart
      data={section9Data}
      groups={[]}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 100,
        yAxisLabel: "％",
        startYear: 2013,
        labelMap
      }}
    />
  );
};
