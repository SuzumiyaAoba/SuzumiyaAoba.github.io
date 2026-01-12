"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section41Data from "@/content/blog/2026-01-01-kakekin/data/section41.json";

export const Section41ChartWrapper: React.FC = () => {
  if (!section41Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "取得ないし増改築 総額 | 万円": "取得・増改築 総額",
    "取得ないし増改築 自己資金 | 万円": "取得・増改築 自己資金",
    "取得ないし増改築 借入金 | 万円": "取得・増改築 借入金",
    "売却 総額 | 万円": "売却 総額"
  };

  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <h4>取得・増改築の資金内訳</h4>
        <LineChart
          data={section41Data}
          groups={[]}
          excludeHeaders={["売却 総額 | 万円"]}
          config={{
            yAxisMin: 0,
            yAxisMax: 3000,
            yAxisLabel: "万円",
            startYear: 2007,
            labelMap
          }}
        />
      </div>
      <div>
        <h4>売却総額</h4>
        <LineChart
          data={section41Data}
          groups={[]}
          excludeHeaders={[
            "取得ないし増改築 総額 | 万円",
            "取得ないし増改築 自己資金 | 万円",
            "取得ないし増改築 借入金 | 万円"
          ]}
          config={{
            yAxisMin: 0,
            yAxisMax: 3000,
            yAxisLabel: "万円",
            startYear: 2007,
            labelMap
          }}
        />
      </div>
    </>
  );
};
