"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section26Data from "@/content/blog/2026-01-01-kakekin/data/section26.json";

export const Section26ChartWrapper: React.FC = () => {
  if (!section26Data) {
    return <div>データが見つかりません</div>;
  }

  const distributionHeaders = [
    "10 万円 未満 | ％",
    "10 ～ 20 万円 未満 | ％",
    "20 ～ 30 万円 未満 | ％",
    "30 ～ 40 万円 未満 | ％",
    "40 ～ 50 万円 未満 | ％",
    "50 ～ 70 万円 未満 | ％",
    "70 ～ 100 万円 未満 | ％",
    "100 ～ 万円 以上 | ％"
  ];

  const labelMap: Record<string, string> = {
    "10 万円 未満 | ％": "10万円未満",
    "10 ～ 20 万円 未満 | ％": "10～20万円",
    "20 ～ 30 万円 未満 | ％": "20～30万円",
    "30 ～ 40 万円 未満 | ％": "30～40万円",
    "40 ～ 50 万円 未満 | ％": "40～50万円",
    "50 ～ 70 万円 未満 | ％": "50～70万円",
    "70 ～ 100 万円 未満 | ％": "70～100万円",
    "100 ～ 万円 以上 | ％": "100万円以上"
  };

  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <h4>金額帯別分布</h4>
        <LineChart
          data={section26Data}
          groups={[]}
          excludeHeaders={["平均 | 万円"]}
          config={{
            yAxisMin: 0,
            yAxisMax: 100,
            yAxisLabel: "％",
            startYear: 1991,
            labelMap
          }}
        />
      </div>
      <div>
        <h4>平均値</h4>
        <LineChart
          data={section26Data}
          groups={[]}
          excludeHeaders={distributionHeaders}
          config={{
            yAxisMin: 0,
            yAxisMax: 90,
            yAxisLabel: "万円",
            startYear: 1991,
            labelMap: { "平均 | 万円": "平均" }
          }}
        />
      </div>
    </>
  );
};
