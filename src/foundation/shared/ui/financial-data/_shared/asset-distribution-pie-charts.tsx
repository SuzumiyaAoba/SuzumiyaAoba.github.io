import { PieChart } from "@/shared/ui/financial-charts";
import type { SheetData } from "@/shared/ui/financial-charts";
import { buildYearlyPieSeries } from "./build-yearly-pie-series";
import { NoDataFallback } from "./no-data-fallback";

const DISTRIBUTION_YEARS = ["2023", "2024", "2025"];

export function AssetDistributionPieCharts({
  data,
  title,
  excludeHeaders,
  labelMap,
}: {
  data: SheetData | null;
  title: string;
  excludeHeaders: string[];
  labelMap: Record<string, string>;
}) {
  if (!data) {
    return <NoDataFallback />;
  }

  const percentageMetrics = data.headers.filter(
    (header) =>
      !excludeHeaders.includes(header) &&
      data.series.some((series) => series.values[header] !== null)
  );
  const yearlyPieSeries = buildYearlyPieSeries(
    data,
    DISTRIBUTION_YEARS,
    percentageMetrics,
    labelMap
  );
  if (!yearlyPieSeries) {
    return <div>2023年、2024年、または2025年のデータが見つかりません</div>;
  }

  return (
    <div className="my-8">
      <div className="mb-4 text-center text-base font-bold">{title}</div>
      <div className="flex flex-col gap-4">
        {yearlyPieSeries.map(({ year, pieData }) => (
          <PieChart key={year} data={pieData} title={`${year}年`} config={{}} />
        ))}
      </div>
    </div>
  );
}
