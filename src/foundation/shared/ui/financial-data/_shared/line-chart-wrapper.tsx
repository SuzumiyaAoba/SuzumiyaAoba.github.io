import {
  LineChart,
  type ChartConfig,
  type MetricGroup,
  type SheetData,
} from "@/shared/ui/financial-charts";
import { NoDataFallback } from "./no-data-fallback";

export type LineChartWrapperSpec = {
  data: SheetData | null | undefined;
  groups?: MetricGroup[];
  excludeHeaders?: string[];
  config: ChartConfig;
};

/**
 * データが無ければ NoDataFallback、あれば LineChart を描画するラッパーを作る。
 * financial-data 配下の静的な LineChart ラッパーの共通ボイラープレート。
 */
export function createLineChartWrapper(spec: LineChartWrapperSpec): React.FC {
  return function LineChartWrapper() {
    if (!spec.data) {
      return <NoDataFallback />;
    }
    return (
      <LineChart
        data={spec.data}
        groups={spec.groups ?? []}
        excludeHeaders={spec.excludeHeaders ?? []}
        config={spec.config}
      />
    );
  };
}
