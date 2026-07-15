"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section34Data from "@/content/blog/2026-01-01-kakekin/data/section34.json";
import { NoDataFallback } from "./_shared/no-data-fallback";
import { ChartSection } from "./_shared/chart-section";

export const Section34ChartWrapper: React.FC = () => {
  if (!section34Data) {
    return <NoDataFallback />;
  }

  const labelMap: Record<string, string> = {
    "金融資産に振り分けた | ％": "振り分けた",
    "5%未満 | ％": "5%未満",
    "5～10%未満 | ％": "5～10%",
    "10～15%未満 | ％": "10～15%",
    "15～20%未満 | ％": "15～20%",
    "20～25%未満 | ％": "20～25%",
    "25～30%未満 | ％": "25～30%",
    "30～35%未満 | ％": "30～35%",
    "35%以上 | ％": "35%以上",
    "振り分けしなかった | ％": "振り分けなし",
    "平均 | ％": "平均",
  };
  const startYear = Number(section34Data.metadata?.startYear ?? 2006);

  return (
    <>
      <ChartSection title="振り分け割合の分布" marginBottom>
        <LineChart
          data={section34Data}
          groups={[]}
          excludeHeaders={["金融資産に振り分けた | ％", "振り分けしなかった | ％", "平均 | ％"]}
          config={{
            yAxisMin: 0,
            yAxisMax: 100,
            yAxisLabel: "％",
            startYear,
            labelMap,
          }}
        />
      </ChartSection>
      <ChartSection title="振り分け有無の割合" marginBottom>
        <LineChart
          data={section34Data}
          groups={[]}
          excludeHeaders={[
            "5%未満 | ％",
            "5～10%未満 | ％",
            "10～15%未満 | ％",
            "15～20%未満 | ％",
            "20～25%未満 | ％",
            "25～30%未満 | ％",
            "30～35%未満 | ％",
            "35%以上 | ％",
            "平均 | ％",
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
      <ChartSection title="平均振り分け割合の推移">
        <LineChart
          data={section34Data}
          groups={[]}
          excludeHeaders={[
            "金融資産に振り分けた | ％",
            "5%未満 | ％",
            "5～10%未満 | ％",
            "10～15%未満 | ％",
            "15～20%未満 | ％",
            "20～25%未満 | ％",
            "25～30%未満 | ％",
            "30～35%未満 | ％",
            "35%以上 | ％",
            "振り分けしなかった | ％",
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
    </>
  );
};
