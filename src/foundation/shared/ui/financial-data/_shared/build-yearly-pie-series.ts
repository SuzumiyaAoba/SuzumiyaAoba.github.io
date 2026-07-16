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
  labelMap: Record<string, string>,
): YearlyPieSeries[] | null {
  const yearlySeries = years.map((year) => data.series.find((s) => s.year === year));

  if (yearlySeries.some((series) => !series)) {
    return null;
  }

  return years.map((year, index) => {
    const series = yearlySeries[index]!;
    const pieData = metrics
      .filter((metric) => series.values[metric] !== null)
      .map((metric) => ({
        label: labelMap[metric] || metric,
        value: series.values[metric] ?? 0,
      }));
    return { year, pieData };
  });
}
