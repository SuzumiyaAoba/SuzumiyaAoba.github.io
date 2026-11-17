import type { ComponentType } from "react";
import { SheetDataSchema } from "@/shared/ui/financial-charts";
import { buildAutoChartConfig } from "../sectionChartUtils";
import { createLineChartWrapper } from "./line-chart-wrapper";

/**
 * 専用ラッパーを持たない節の JSON。設定を書かずにデータから軸を自動で決める。
 * glob はチャートごとに分割されるため、描画される節のデータだけが取得される。
 */
const sectionData = import.meta.glob<unknown>(
  "/content/blog/2026-01-01-kakekin/data/section*.json",
  { import: "default" }
);

const AUTO_SECTION_NAME = /^Section(\d+)ChartWrapper$/u;

/**
 * `SectionNNChartWrapper` という名前から sectionNN.json を読み、
 * 自動設定の折れ線グラフを作る。専用ラッパーファイルがあればそちらが優先される。
 */
export async function loadAutoSectionChart(
  name: string
): Promise<ComponentType> {
  const sectionNumber = AUTO_SECTION_NAME.exec(name)?.[1];
  const loader =
    sectionNumber === undefined
      ? undefined
      : sectionData[
          `/content/blog/2026-01-01-kakekin/data/section${sectionNumber}.json`
        ];
  if (!loader) {
    throw new Error(`Unknown chart component: ${name}`);
  }
  const parsed = SheetDataSchema.safeParse(await loader());
  if (!parsed.success) {
    throw new TypeError(`Invalid chart data for ${name}`);
  }
  return createLineChartWrapper({
    data: parsed.data,
    config: buildAutoChartConfig(parsed.data),
  });
}
