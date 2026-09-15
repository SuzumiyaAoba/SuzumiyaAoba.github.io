import type { SheetData } from "@/shared/ui/financial-charts";

export type YearlyPieSeries = {
  year: string;
  pieData: { label: string; value: number }[];
};

/**
 * 指定した複数年について、metrics(ヘッダー名)群から円グラフ用データを組み立てる。
 * いずれかの年のデータが見つからない場合はnullを返す。
 */
export function buildYearlyPieSeries(
  data: SheetData,
  years: string[],
  metrics: string[],
  labelMap: Record<string, string>
): YearlyPieSeries[] | null {
  const result: YearlyPieSeries[] = [];
  for (const year of years) {
    const series = data.series.find((row) => row.year === year);
    if (!series) {
      return null;
    }
    const pieData = metrics
      .filter((metric) => series.values[metric] !== null)
      .map((metric) => ({
        label: labelMap[metric] || metric,
        value: series.values[metric] ?? 0,
      }));
    result.push({ year, pieData });
  }
  return result;
}
