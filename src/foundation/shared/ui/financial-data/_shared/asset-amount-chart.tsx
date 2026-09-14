import { LineChart } from "@/shared/ui/financial-charts";
import type { SheetData } from "@/shared/ui/financial-charts";
import { computeMaxValueForMetrics, roundUpToStep } from "../sectionChartUtils";
import { NoDataFallback } from "./no-data-fallback";

const AMOUNT_LABELS: Record<string, string> = {
  "平均 | 万円": "平均",
  "中央値 | 万円": "中央値",
};
const AMOUNT_METRICS = Object.keys(AMOUNT_LABELS);

/** 金融資産の分布から平均・中央値だけを取り出し、500万円刻みの軸で表示する。 */
export function AssetAmountChart({
  data,
  startYear,
}: {
  data: SheetData | null;
  startYear: number;
}) {
  if (!data) {
    return <NoDataFallback />;
  }

  const excludeHeaders = data.headers.filter((header) => !AMOUNT_METRICS.includes(header));
  const amountMetrics = AMOUNT_METRICS.filter((header) =>
    data.series.some((series) => series.values[header] !== null),
  );
  const yAxisMax = roundUpToStep(computeMaxValueForMetrics(data, amountMetrics), 500);

  return (
    <LineChart
      data={data}
      groups={[]}
      excludeHeaders={excludeHeaders}
      config={{ yAxisMin: 0, yAxisMax, yAxisLabel: "万円", startYear, labelMap: AMOUNT_LABELS }}
    />
  );
}
