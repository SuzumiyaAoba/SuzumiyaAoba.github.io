"use client";

import { StackedBarChart } from "@/components/Charts";
import type { SheetData } from "@/components/Charts";
import assetsData from "@/contents/blog/2026-01-01-kakekin/data/assets.json";

export const Sheet4BarChartWrapper: React.FC = () => {
  const sheet4Data = assetsData.sheets["4"] as SheetData;

  if (!sheet4Data) {
    return <div>データが見つかりません</div>;
  }

  const excludeHeaders = [
    "平均 | 万円",         // 金額データ
    "中央値 | 万円"        // 金額データ
  ];

  // パーセンテージデータのみを抽出（平均・中央値以外）
  const percentageMetrics = sheet4Data.headers.filter((header) => {
    return !excludeHeaders.includes(header) &&
           sheet4Data.series.some((s) => s.values[header] !== null);
  });

  // ラベルマッピング
  const labelMap: Record<string, string> = {
    "金融資産 非保有 | ％": "金融資産非保有",
    "100 | 万円 | 未満 | ％": "100万円未満",
    "100 | ～ | 200 | 万円 未満 | ％": "100～200万円未満",
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
      data={sheet4Data}
      groups={[]}
      excludeHeaders={excludeHeaders}
      config={{
        yAxisMin: 0,
        yAxisMax: 100,
        yAxisLabel: "%",
        startYear: 2004,
        labelMap
      }}
    />
  );
};
