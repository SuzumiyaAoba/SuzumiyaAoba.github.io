"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section41Data from "@/content/blog/2026-01-01-kakekin/data/section41.json";
import { ChartSection } from "./_shared/chart-section";

export const Section41ChartWrapper: React.FC = () => {
  const labelMap: Record<string, string> = {
    "取得ないし増改築 総額 | 万円": "取得・増改築 総額",
    "取得ないし増改築 自己資金 | 万円": "取得・増改築 自己資金",
    "取得ないし増改築 借入金 | 万円": "取得・増改築 借入金",
    "売却 総額 | 万円": "売却 総額",
  };

  return (
    <>
      <ChartSection title="取得・増改築の資金内訳" marginBottom>
        <LineChart
          data={section41Data}
          groups={[]}
          excludeHeaders={["売却 総額 | 万円"]}
          config={{
            yAxisMin: 0,
            yAxisMax: 3000,
            yAxisLabel: "万円",
            startYear: 2007,
            labelMap,
          }}
        />
      </ChartSection>
      <ChartSection title="売却総額">
        <LineChart
          data={section41Data}
          groups={[]}
          excludeHeaders={[
            "取得ないし増改築 総額 | 万円",
            "取得ないし増改築 自己資金 | 万円",
            "取得ないし増改築 借入金 | 万円",
          ]}
          config={{
            yAxisMin: 0,
            yAxisMax: 3000,
            yAxisLabel: "万円",
            startYear: 2007,
            labelMap,
          }}
        />
      </ChartSection>
    </>
  );
};
