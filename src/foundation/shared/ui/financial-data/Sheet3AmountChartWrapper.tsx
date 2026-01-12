"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import type { SheetData } from "@/shared/ui/financial-charts";
import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";

export const Sheet3AmountChartWrapper: React.FC = () => {
  const sheet3Data = assetsData.sheets["3"] as SheetData;

  if (!sheet3Data) {
    return <div>データが見つかりません</div>;
  }

  // パーセンテージデータをすべて除外し、平均と中央値のみを表示
  const excludeHeaders = sheet3Data.headers.filter((header) => {
    // 平均と中央値以外をすべて除外
    return header !== "平均 | 万円" && header !== "中央値 | 万円";
  });

  // 万円データのみを抽出（平均と中央値）
  const amountMetrics = ["平均 | 万円", "中央値 | 万円"].filter((header) =>
    sheet3Data.series.some((s) => s.values[header] !== null),
  );

  // Y軸の最大値を計算
  const maxValue = Math.max(
    ...sheet3Data.series.flatMap((s) => amountMetrics.map((m) => (s.values[m] as number) || 0)),
  );
  const yAxisMax = Math.ceil(maxValue / 500) * 500; // 500の倍数に切り上げ

  // ラベルマッピング
  const labelMap: Record<string, string> = {
    "平均 | 万円": "平均",
    "中央値 | 万円": "中央値",
  };

  return (
    <LineChart
      data={sheet3Data}
      groups={[]}
      excludeHeaders={excludeHeaders}
      config={{
        yAxisMin: 0,
        yAxisMax: yAxisMax,
        yAxisLabel: "万円",
        startYear: 1963,
        labelMap,
      }}
    />
  );
};
