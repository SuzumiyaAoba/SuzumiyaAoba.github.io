"use client";

import { LineChart } from "@/components/Charts";
import type { MetricGroup } from "@/components/Charts/types";
import section13Data from "@/contents/blog/2025-12-26-kakekin/data/section13.json";

export const Section13ChartWrapper: React.FC = () => {
  if (!section13Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "増えた | ％": "増えた",
    "非常に増えた | ％": "非常に増えた",
    "若干増えた | ％": "若干増えた",
    "変わらない | ％": "変わらない",
    "減った | ％": "減った",
    "若干減った | ％": "若干減った",
    "非常に減った | ％": "非常に減った"
  };

  const groups: MetricGroup[] = [
    {
      name: "増加",
      metrics: [
        "増えた | ％",
        "非常に増えた | ％",
        "若干増えた | ％"
      ]
    },
    {
      name: "変化なし",
      metrics: [
        "変わらない | ％"
      ]
    },
    {
      name: "減少",
      metrics: [
        "減った | ％",
        "若干減った | ％",
        "非常に減った | ％"
      ]
    }
  ];

  return (
    <LineChart
      data={section13Data}
      groups={groups}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 60,
        yAxisLabel: "％",
        startYear: 1988,
        labelMap
      }}
    />
  );
};
