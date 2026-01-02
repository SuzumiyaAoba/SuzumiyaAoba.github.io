"use client";

import { LineChart } from "@/components/Charts";
import section25Data from "@/contents/blog/2026-01-01-kakekin/data/section25.json";

export const Section25ChartWrapper: React.FC = () => {
  if (!section25Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "現金 | ％": "現金",
    "クレジットカード | ％": "クレジットカード",
    "電子マネー | ％": "電子マネー",
    "プリペイドカード | ％": "プリペイドカード",
    "口座振替 | ％": "口座振替",
    "その他 | ％": "その他"
  };

  return (
    <LineChart
      data={section25Data}
      groups={[]}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 100,
        yAxisLabel: "％",
        startYear: 1991,
        labelMap
      }}
    />
  );
};
