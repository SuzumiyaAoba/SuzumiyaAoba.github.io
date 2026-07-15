"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section39Data from "@/content/blog/2026-01-01-kakekin/data/section39.json";
import { NoDataFallback } from "./_shared/no-data-fallback";
import { ChartSection } from "./_shared/chart-section";

export const Section39ChartWrapper: React.FC = () => {
  if (!section39Data) {
    return <NoDataFallback />;
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
    "減った割合 | 割": "減った割合",
  };
  const startYear = Number(section39Data.metadata?.startYear ?? 2006);

  return (
    <>
      <ChartSection title="増減の概要" marginBottom>
        <LineChart
          data={section39Data}
          groups={[]}
          excludeHeaders={[
            "非常に増えた | ％",
            "若干増えた | ％",
            "増えた割合 | 割",
            "若干減った | ％",
            "非常に減った | ％",
            "減った割合 | 割",
          ]}
          config={{
            yAxisMin: 0,
            yAxisMax: 100,
            yAxisLabel: "％",
            startYear,
            labelMap,
          }}
        />
      </ChartSection>
      <ChartSection title="増減の詳細（内訳あり）">
        <LineChart
          data={section39Data}
          groups={[]}
          excludeHeaders={["増えた | ％", "増えた割合 | 割", "減った | ％", "減った割合 | 割"]}
          config={{
            yAxisMin: 0,
            yAxisMax: 100,
            yAxisLabel: "％",
            startYear,
            labelMap,
          }}
        />
      </ChartSection>
    </>
  );
};
