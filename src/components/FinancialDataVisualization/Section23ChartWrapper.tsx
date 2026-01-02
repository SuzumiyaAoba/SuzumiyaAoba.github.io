"use client";

import { LineChart } from "@/components/Charts";
import section23Data from "@/contents/blog/2026-01-01-kakekin/data/section23.json";

export const Section23ChartWrapper: React.FC = () => {
  if (!section23Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "1,000円以下：現金 | ％": "1,000円以下：現金",
    "1,000円以下：クレジットカード | ％": "1,000円以下：カード",
    "1,000円以下：電子マネー | ％": "1,000円以下：電子マネー",
    "1,000円以下：その他 | ％": "1,000円以下：その他",
    "1,000円超5,000円以下：現金 | ％": "1,000～5,000円：現金",
    "1,000円超5,000円以下：クレジットカード | ％": "1,000～5,000円：カード",
    "1,000円超5,000円以下：電子マネー | ％": "1,000～5,000円：電子マネー",
    "1,000円超5,000円以下：その他 | ％": "1,000～5,000円：その他",
    "5,000円超10,000円以下：現金 | ％": "5,000～10,000円：現金",
    "5,000円超10,000円以下：クレジットカード | ％": "5,000～10,000円：カード",
    "5,000円超10,000円以下：電子マネー | ％": "5,000～10,000円：電子マネー",
    "5,000円超10,000円以下：その他 | ％": "5,000～10,000円：その他"
  };

  return (
    <LineChart
      data={section23Data}
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
