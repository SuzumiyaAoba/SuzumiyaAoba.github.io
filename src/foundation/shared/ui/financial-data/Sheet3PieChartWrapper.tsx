"use client";

import { PieChart } from "@/shared/ui/financial-charts/PieChart";
import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";
import type { SheetData } from "@/shared/ui/financial-charts";

export const Sheet3PieChartWrapper: React.FC = () => {
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

  // 2023年、2024年、2025年のデータを取得
  const year2023Data = sheet3Data.series.find((s) => s.year === "2023");
  const year2024Data = sheet3Data.series.find((s) => s.year === "2024");
  const year2025Data = sheet3Data.series.find((s) => s.year === "2025");

  if (!year2023Data || !year2024Data || !year2025Data) {
    return <div>2023年、2024年、または2025年のデータが見つかりません</div>;
  }

  // 円グラフ用のデータを作成
  const pieData2023 = percentageMetrics
    .filter((metric) => year2023Data.values[metric] !== null)
    .map((metric) => ({
      label: labelMap[metric] || metric,
      value: year2023Data.values[metric] as number,
    }));

  const pieData2024 = percentageMetrics
    .filter((metric) => year2024Data.values[metric] !== null)
    .map((metric) => ({
      label: labelMap[metric] || metric,
      value: year2024Data.values[metric] as number,
    }));

  const pieData2025 = percentageMetrics
    .filter((metric) => year2025Data.values[metric] !== null)
    .map((metric) => ({
      label: labelMap[metric] || metric,
      value: year2025Data.values[metric] as number,
    }));

  return (
    <div className="my-8">
      <div className="text-center font-bold text-base mb-4">金融資産保有額の分布</div>
      <div className="flex flex-col gap-4">
        <PieChart data={pieData2023} title="2023年" config={{}} />
        <PieChart data={pieData2024} title="2024年" config={{}} />
        <PieChart data={pieData2025} title="2025年" config={{}} />
      </div>
    </div>
  );
};
