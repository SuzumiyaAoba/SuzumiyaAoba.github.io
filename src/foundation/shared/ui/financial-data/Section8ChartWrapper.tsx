"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import type { MetricGroup } from "@/shared/ui/financial-charts/types";
import section8Data from "@/content/blog/2026-01-01-kakekin/data/section8.json";

export const Section8ChartWrapper: React.FC = () => {
  if (!section8Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "振り分けた | ％": "振り分けた",
    "5%未満 | ％": "5%未満",
    "5～10%未満 | ％": "5～10%未満",
    "10～15%未満 | ％": "10～15%未満",
    "15～20%未満 | ％": "15～20%未満",
    "20～25%未満 | ％": "20～25%未満",
    "25～30%未満 | ％": "25～30%未満",
    "30～35%未満 | ％": "30～35%未満",
    "35%以上 | ％": "35%以上",
    "振り分けしなかった | ％": "振り分けしなかった",
    "平均 | ％": "平均"
  };

  const groups: MetricGroup[] = [
    {
      name: "振り分け状況",
      metrics: [
        "振り分けた | ％",
        "振り分けしなかった | ％"
      ]
    },
    {
      name: "振り分け割合の分布",
      metrics: [
        "平均 | ％",
        "5%未満 | ％",
        "5～10%未満 | ％",
        "10～15%未満 | ％",
        "15～20%未満 | ％",
        "20～25%未満 | ％",
        "25～30%未満 | ％",
        "30～35%未満 | ％",
        "35%以上 | ％"
      ]
    }
  ];

  return (
    <LineChart
      data={section8Data}
      groups={groups}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 70,
        yAxisLabel: "％",
        startYear: 1965,
        labelMap
      }}
    />
  );
};
