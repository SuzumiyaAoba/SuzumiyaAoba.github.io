import { LineChart, StackedBarChart } from "@/shared/ui/financial-charts";
import { getAssetSheet } from "./asset-sheets";
import { NoDataFallback } from "./no-data-fallback";

const OWNERSHIP_SHEETS = {
  "1": {
    startYear: 2006,
    excludeHeaders: ["現在保有している金融商品 | 預貯金 （ゆうちょ銀行の貯金を含む） | ％"],
    groups: [
      { name: "口座の有無（注１）", from: 1, to: 5 },
      { name: "現在保有している金融商品", from: 6, to: Infinity },
    ],
  },
  "2": {
    startYear: 1963,
    excludeHeaders: ["column_8", "column_9", "column_10", "column_11"],
    groups: [
      { name: "金融資産の有無（注1）", from: 0, to: 2 },
      { name: "金融資産非保有世帯の預貯金口座の有無（注2）", from: 2, to: 5 },
    ],
  },
};

/** 折れ線と積み上げ棒グラフで、同じシートの分類と軸を共有する。 */
export function AssetOwnershipChart({
  sheetKey,
  kind,
}: {
  sheetKey: keyof typeof OWNERSHIP_SHEETS;
  kind: "line" | "bar";
}) {
  const data = getAssetSheet(sheetKey);
  if (!data) {
    return <NoDataFallback />;
  }

  const { startYear, excludeHeaders, groups } = OWNERSHIP_SHEETS[sheetKey];
  const availableMetrics = data.headers.filter(
    (header) =>
      !excludeHeaders.includes(header) &&
      data.series.some((series) => series.values[header] !== null) &&
      (sheetKey === "1" || header.includes("％")),
  );
  const metricGroups = groups.map(({ name, from, to }) => ({
    name,
    metrics: availableMetrics.filter((metric) => {
      const index = data.headers.indexOf(metric);
      return index >= from && index < to;
    }),
  }));
  const Chart = kind === "line" ? LineChart : StackedBarChart;

  return (
    <Chart
      data={data}
      groups={metricGroups}
      excludeHeaders={excludeHeaders}
      config={{ yAxisMin: 0, yAxisMax: 100, yAxisLabel: "%", startYear }}
    />
  );
}
