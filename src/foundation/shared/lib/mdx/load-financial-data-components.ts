import type { MDXComponents } from "mdx/types";

/**
 * financial-data のチャート群を実行時に読み込む。
 *
 * 静的 import にすると、チャートを使わない記事のバンドルにも
 * マップ定義が含まれてしまうため、必ずこのローダー経由で取得する。
 */
export async function loadFinancialDataComponents(): Promise<MDXComponents> {
  const mod = await import("./financial-data-components");
  return mod.financialDataComponents;
}
