"use client";

import { LineChart } from "@/components/Charts";
import section39Data from "@/contents/blog/2026-01-01-kakekin/data/section39.json";

export const Section39ChartWrapper: React.FC = () => {
  if (!section39Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "増えた | ％": "増えた",
    "非常に増えた | ％": "非常に増えた",
    "若干増えた | ％": "若干増えた",
    "増えた割合 | 割": "増えた割合",
    "変わらない | ％": "変わらない",
    "減った | ％": "減った",
    "若干減った | ％": "若干減った",
    "非常に減った | ％": "非常に減った",
    "減った割合 | 割": "減った割合"
  };
  const startYear = Number(section39Data.metadata?.startYear ?? 2006);

  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <h4>増減の概要</h4>
        <LineChart
          data={section39Data}
          groups={[]}
          excludeHeaders={[
            "非常に増えた | ％",
            "若干増えた | ％",
            "増えた割合 | 割",
            "若干減った | ％",
            "非常に減った | ％",
            "減った割合 | 割"
          ]}
          config={{
            yAxisMin: 0,
            yAxisMax: 100,
            yAxisLabel: "％",
            startYear,
            labelMap
          }}
        />
      </div>
      <div>
        <h4>増減の詳細（内訳あり）</h4>
        <LineChart
          data={section39Data}
          groups={[]}
          excludeHeaders={[
            "増えた | ％",
            "増えた割合 | 割",
            "減った | ％",
            "減った割合 | 割"
          ]}
          config={{
            yAxisMin: 0,
            yAxisMax: 100,
            yAxisLabel: "％",
            startYear,
            labelMap
          }}
        />
      </div>
    </>
  );
};
