"use client";

import { SheetDataSchema, StackedBarChart, type MetricGroup } from "@/shared/ui/financial-charts";
import assetsData from "@/content/blog/2026-01-01-kakekin/data/assets.json";

export const Sheet1BarLineChartWrapper: React.FC = () => {
  const result = SheetDataSchema.safeParse(assetsData.sheets["1"]);
  const sheet1Data = result.success ? result.data : null;

  if (!sheet1Data) {
    return <div>データが見つかりません</div>;
  }

  const excludeHeaders = ["現在保有している金融商品 | 預貯金 （ゆうちょ銀行の貯金を含む） | ％"];

  const availableMetrics = sheet1Data.headers.filter((header) => {
    return (
      !excludeHeaders.includes(header) && sheet1Data.series.some((s) => s.values[header] !== null)
    );
  });

  const groups: MetricGroup[] = [
    {
      name: "口座の有無（注１）",
      metrics: availableMetrics.filter((m) => {
        const headerIdx = sheet1Data.headers.indexOf(m);
        return headerIdx > 0 && headerIdx < 5;
      }),
    },
    {
      name: "現在保有している金融商品",
      metrics: availableMetrics.filter((m) => {
        const headerIdx = sheet1Data.headers.indexOf(m);
        return headerIdx >= 6;
      }),
    },
  ];

  return (
    <StackedBarChart
      data={sheet1Data}
      groups={groups}
      excludeHeaders={excludeHeaders}
      config={{
        yAxisMin: 0,
        yAxisMax: 100,
        yAxisLabel: "%",
        startYear: 2006,
      }}
    />
  );
};
