"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import type { SheetData } from "@/shared/ui/financial-charts";
import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";

export const Sheet3ChartWrapper: React.FC = () => {
  const sheet3Data = assetsData.sheets["3"] as SheetData;

  if (!sheet3Data) {
    return <div>データが見つかりません</div>;
  }

  const excludeHeaders = [
    "％ | （150万円以上）", // nullデータ
    "平均 | 万円", // 金額データ
    "中央値 | 万円", // 金額データ
  ];

  // パーセンテージデータのみを抽出（平均・中央値以外）
  const percentageMetrics = sheet3Data.headers.filter((header) => {
    return (
      !excludeHeaders.includes(header) && sheet3Data.series.some((s) => s.values[header] !== null)
    );
  });

  // Y軸の最大値を計算
  const maxValue = Math.max(
    ...sheet3Data.series.flatMap((s) => percentageMetrics.map((m) => (s.values[m] as number) || 0)),
  );
  const yAxisMax = Math.ceil(maxValue / 5) * 5; // 5の倍数に切り上げ

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
    <LineChart
      data={sheet3Data}
      groups={[]}
      excludeHeaders={excludeHeaders}
      config={{
        yAxisMin: 0,
        yAxisMax: yAxisMax,
        yAxisLabel: "%",
        startYear: 1963,
        labelMap,
      }}
    />
  );
};
