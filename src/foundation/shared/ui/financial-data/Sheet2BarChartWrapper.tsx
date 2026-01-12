"use client";

import { StackedBarChart } from "@/shared/ui/financial-charts";
import type { MetricGroup, SheetData } from "@/shared/ui/financial-charts";
import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";

export const Sheet2BarChartWrapper: React.FC = () => {
  const sheet2Data = assetsData.sheets["2"] as SheetData;

  if (!sheet2Data) {
    return <div>データが見つかりません</div>;
  }

  const excludeHeaders = ["column_8", "column_9", "column_10", "column_11"];

  const availableMetrics = sheet2Data.headers.filter((header) => {
    return (
      !excludeHeaders.includes(header) && sheet2Data.series.some((s) => s.values[header] !== null)
    );
  });

  // パーセンテージデータのみを抽出
  const percentageMetrics = availableMetrics.filter((m) => m.includes("％"));

  const groups: MetricGroup[] = [
    {
      name: "金融資産の有無（注1）",
      metrics: percentageMetrics.filter((m) => {
        const headerIdx = sheet2Data.headers.indexOf(m);
        return headerIdx >= 0 && headerIdx < 2;
      }),
    },
    {
      name: "金融資産非保有世帯の預貯金口座の有無（注2）",
      metrics: percentageMetrics.filter((m) => {
        const headerIdx = sheet2Data.headers.indexOf(m);
        return headerIdx >= 2 && headerIdx < 5;
      }),
    },
  ];

  return (
    <StackedBarChart
      data={sheet2Data}
      groups={groups}
      excludeHeaders={excludeHeaders}
      config={{
        yAxisMin: 0,
        yAxisMax: 100,
        yAxisLabel: "%",
        startYear: 1963,
      }}
    />
  );
};
