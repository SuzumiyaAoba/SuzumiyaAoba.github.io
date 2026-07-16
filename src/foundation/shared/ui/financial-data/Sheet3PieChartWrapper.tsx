"use client";

import { PieChart } from "@/shared/ui/financial-charts/PieChart";

import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";
import { NoDataFallback } from "./_shared/no-data-fallback";
import { parseSheetData } from "./_shared/parse-sheet-data";
import { SHEET3_EXCLUDE_HEADERS, SHEET3_LABEL_MAP } from "./_shared/sheet3-asset-labels";

export const Sheet3PieChartWrapper: React.FC = () => {
  const sheet3Data = parseSheetData(assetsData, "3");

  if (!sheet3Data) {
    return <NoDataFallback />;
  }

  // パーセンテージデータのみを抽出（平均・中央値以外）
  const percentageMetrics = sheet3Data.headers.filter((header) => {
    return (
      !SHEET3_EXCLUDE_HEADERS.includes(header) &&
      sheet3Data.series.some((s) => s.values[header] !== null)
    );
  });

  const labelMap = SHEET3_LABEL_MAP;

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
      value: year2023Data.values[metric] ?? 0,
    }));

  const pieData2024 = percentageMetrics
    .filter((metric) => year2024Data.values[metric] !== null)
    .map((metric) => ({
      label: labelMap[metric] || metric,
      value: year2024Data.values[metric] ?? 0,
    }));

  const pieData2025 = percentageMetrics
    .filter((metric) => year2025Data.values[metric] !== null)
    .map((metric) => ({
      label: labelMap[metric] || metric,
      value: year2025Data.values[metric] ?? 0,
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
