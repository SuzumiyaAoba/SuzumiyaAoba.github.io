"use client";

import { StackedBarChart } from "@/shared/ui/financial-charts";
import type { SheetData } from "@/shared/ui/financial-charts";
import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";

export const Sheet3BarChartWrapper: React.FC = () => {
  const sheet3Data = assetsData.sheets["3"] as SheetData;

  if (!sheet3Data) {
    return <div>データが見つかりません</div>;
  }

  const excludeHeaders = [
    "％ | （150万円以上）", // nullデータ
    "平均 | 万円", // 金額データ
    "中央値 | 万円", // 金額データ
  ];

  // ラベルマッピング
  const labelMap: Record<string, string> = {
    "100 | 万円 | 未満 | ％": "100万円未満",
    "100 | ～ | 200 | 万円 未満 | (100～ 150万円未満)": "100～200万円未満",
    "200 | ～ | 300 | 万円 未満 | ％": "200～300万円未満",
    "300 | ～ | 400 | 万円 未満 | ％": "300～400万円未満",
    "400 | ～ | 500 | 万円 未満 | ％": "400～500万円未満",
    "500 | ～ | 700 | 万円 未満 | ％": "500～700万円未満",
    "700 | ～ | 1000 | 万円 未満 | ％": "700～1000万円未満",
    "1000 | ～ | 1500 | 万円 未満 | ％": "1000～1500万円未満",
    "1500 | ～ | 2000 | 万円 未満 | ％": "1500～2000万円未満",
    "2000 | ～ | 3000 | 万円 未満 | ％": "2000～3000万円未満",
    "3000 | 万円 | 以上 | ％": "3000万円以上",
  };

  return (
    <StackedBarChart
      data={sheet3Data}
      groups={[]}
      excludeHeaders={excludeHeaders}
      config={{
        yAxisMin: 0,
        yAxisMax: 100,
        yAxisLabel: "%",
        startYear: 1963,
        labelMap,
      }}
    />
  );
};
