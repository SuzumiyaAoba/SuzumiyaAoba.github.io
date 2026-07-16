"use client";

import { PieChart } from "@/shared/ui/financial-charts";

import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";
import { NoDataFallback } from "./_shared/no-data-fallback";
import { parseSheetData } from "./_shared/parse-sheet-data";
import { SHEET3_EXCLUDE_HEADERS, SHEET3_LABEL_MAP } from "./_shared/sheet3-asset-labels";
import { buildYearlyPieSeries } from "./_shared/build-yearly-pie-series";

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

  const yearlyPieSeries = buildYearlyPieSeries(
    sheet3Data,
    ["2023", "2024", "2025"],
    percentageMetrics,
    SHEET3_LABEL_MAP,
  );

  if (!yearlyPieSeries) {
    return <div>2023年、2024年、または2025年のデータが見つかりません</div>;
  }

  return (
    <div className="my-8">
      <div className="text-center font-bold text-base mb-4">金融資産保有額の分布</div>
      <div className="flex flex-col gap-4">
        {yearlyPieSeries.map(({ year, pieData }) => (
          <PieChart key={year} data={pieData} title={`${year}年`} config={{}} />
        ))}
      </div>
    </div>
  );
};
