"use client";

import { LineChart, SheetDataSchema } from "@/shared/ui/financial-charts";
import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";

export const Sheet4AmountChartWrapper: React.FC = () => {
  const result = SheetDataSchema.safeParse(assetsData.sheets["4"]);
  const sheet4Data = result.success ? result.data : null;

  if (!sheet4Data) {
    return <div>データが見つかりません</div>;
  }

  // パーセンテージデータをすべて除外し、平均と中央値のみを表示
  const excludeHeaders = sheet4Data.headers.filter((header) => {
    // 平均と中央値以外をすべて除外
    return header !== "平均 | 万円" && header !== "中央値 | 万円";
  });

  // 万円データのみを抽出（平均と中央値）
  const amountMetrics = ["平均 | 万円", "中央値 | 万円"].filter((header) =>
    sheet4Data.series.some((s) => s.values[header] !== null),
  );

  // Y軸の最大値を計算
  const maxValue = Math.max(
    ...sheet4Data.series.flatMap((s) => amountMetrics.map((m) => (s.values[m] ?? 0) || 0)),
  );
  const yAxisMax = Math.ceil(maxValue / 500) * 500; // 500の倍数に切り上げ

  // ラベルマッピング
  const labelMap: Record<string, string> = {
    "平均 | 万円": "平均",
    "中央値 | 万円": "中央値",
  };

  return (
    <LineChart
      data={sheet4Data}
      groups={[]}
      excludeHeaders={excludeHeaders}
      config={{
        yAxisMin: 0,
        yAxisMax: yAxisMax,
        yAxisLabel: "万円",
        startYear: 2004,
        labelMap,
      }}
    />
  );
};
