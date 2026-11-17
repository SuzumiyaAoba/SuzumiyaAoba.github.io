import { StackedBarChart } from "@/shared/ui/financial-charts";
import { createLineChartWrapper } from "./line-chart-wrapper";
import { NoDataFallback } from "./no-data-fallback";
import { getAssetSheet } from "./asset-sheets";
import { computeMaxValueForMetrics, roundUpToStep } from "../sectionChartUtils";

/** 資産分布シート（sheet3 / sheet4）ごとに異なる設定。 */
export type AssetSheetSpec = {
  sheetId: string;
  excludeHeaders: string[];
  labelMap: Record<string, string>;
  startYear: number;
};

const PERCENT_AXIS_LABEL = "%";
const PERCENT_AXIS_MAX = 100;
/** 折れ線チャートの Y 軸最大値はこの刻みで切り上げる。 */
const LINE_Y_AXIS_STEP = 5;

/** 平均・中央値など除外対象以外で、値を 1 つでも持つ指標の最大値を刻みで切り上げる。 */
function computeLineYAxisMax(
  data: NonNullable<ReturnType<typeof getAssetSheet>>,
  excludeHeaders: string[]
): number {
  const excludeSet = new Set(excludeHeaders);
  const percentageMetrics = data.headers.filter(
    (header) =>
      !excludeSet.has(header) &&
      data.series.some((s) => s.values[header] !== null)
  );
  return roundUpToStep(
    computeMaxValueForMetrics(data, percentageMetrics),
    LINE_Y_AXIS_STEP
  );
}

/** 資産分布シートの割合推移を折れ線で描くラッパーを作る。 */
export function createAssetSheetLineChart(spec: AssetSheetSpec): React.FC {
  const data = getAssetSheet(spec.sheetId);
  return createLineChartWrapper({
    data,
    excludeHeaders: spec.excludeHeaders,
    config: {
      yAxisMin: 0,
      yAxisMax: data ? computeLineYAxisMax(data, spec.excludeHeaders) : 0,
      yAxisLabel: PERCENT_AXIS_LABEL,
      startYear: spec.startYear,
      labelMap: spec.labelMap,
    },
  });
}

/** 資産分布シートの構成比を積み上げ棒で描くラッパーを作る。 */
export function createAssetSheetBarChart(spec: AssetSheetSpec): React.FC {
  function AssetSheetBarChart() {
    const data = getAssetSheet(spec.sheetId);
    if (!data) {
      return <NoDataFallback />;
    }
    return (
      <StackedBarChart
        data={data}
        groups={[]}
        excludeHeaders={spec.excludeHeaders}
        config={{
          yAxisMin: 0,
          yAxisMax: PERCENT_AXIS_MAX,
          yAxisLabel: PERCENT_AXIS_LABEL,
          startYear: spec.startYear,
          labelMap: spec.labelMap,
        }}
      />
    );
  }
  return AssetSheetBarChart;
}
