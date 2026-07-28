import type { MDXComponents } from "mdx/types";

import { FinancialChartLazy } from "@/shared/ui/financial-data/financial-chart-lazy";

/**
 * financial-data 系チャートのコンポーネントマップ。
 *
 * このモジュールは必ず実行時 `await import()` で読み込むこと。
 * サーバーモジュールから静的に参照すると、ここにある 85 件の dynamic() が
 * 全てルートのクライアント参照として登録され、チャートを使わない記事にも
 * 約 115KB(gzip) が初期ロードで載る（実際に使うのは 1 記事のみ）。
 *
 * 開発時も同様で、常時参照すると記事を編集するたびに 100 件以上の
 * dynamic import が HMR 対象になり Chrome のレンダラーが OOM する。
 */
const FINANCIAL_CHART_NAMES = [
  "Section10ChartWrapper", "Section11ChartWrapper", "Section12ChartWrapper",
  "Section13ChartWrapper", "Section14ChartWrapper", "Section15ChartWrapper",
  "Section16ChartWrapper", "Section17ChartWrapper", "Section18ChartWrapper",
  "Section19ChartWrapper", "Section20ChartWrapper", "Section21ChartWrapper",
  "Section22ChartWrapper", "Section23ChartWrapper", "Section24ChartWrapper",
  "Section25ChartWrapper", "Section26ChartWrapper", "Section27ChartWrapper",
  "Section28ChartWrapper", "Section29ChartWrapper", "Section30ChartWrapper",
  "Section31ChartWrapper", "Section32ChartWrapper", "Section33ChartWrapper",
  "Section34ChartWrapper", "Section35ChartWrapper", "Section36ChartWrapper",
  "Section37ChartWrapper", "Section38ChartWrapper", "Section39ChartWrapper",
  "Section40ChartWrapper", "Section41ChartWrapper", "Section42ChartWrapper",
  "Section43ChartWrapper", "Section44ChartWrapper", "Section45ChartWrapper",
  "Section46ChartWrapper", "Section47ChartWrapper", "Section48ChartWrapper",
  "Section49ChartWrapper", "Section50ChartWrapper", "Section51ChartWrapper",
  "Section52ChartWrapper", "Section53ChartWrapper", "Section54ChartWrapper",
  "Section55ChartWrapper", "Section56ChartWrapper", "Section57ChartWrapper",
  "Section58ChartWrapper", "Section59ChartWrapper", "Section5ChartWrapper",
  "Section60ChartWrapper", "Section61ChartWrapper", "Section62ChartWrapper",
  "Section63ChartWrapper", "Section64ChartWrapper", "Section65ChartWrapper",
  "Section66ChartWrapper", "Section67ChartWrapper", "Section68ChartWrapper",
  "Section69ChartWrapper", "Section6ChartWrapper", "Section70ChartWrapper",
  "Section71ChartWrapper", "Section72ChartWrapper", "Section73ChartWrapper",
  "Section74ChartWrapper", "Section75ChartWrapper", "Section7ChartWrapper",
  "Section8ChartWrapper", "Section9ChartWrapper", "Sheet1BarLineChartWrapper",
  "Sheet1ChartWrapper", "Sheet1StackedChartWrapper", "Sheet2AmountChartWrapper",
  "Sheet2BarChartWrapper", "Sheet2ChartWrapper", "Sheet3AmountChartWrapper",
  "Sheet3BarChartWrapper", "Sheet3ChartWrapper", "Sheet3PieChartWrapper",
  "Sheet4AmountChartWrapper", "Sheet4BarChartWrapper", "Sheet4ChartWrapper",
  "Sheet4PieChartWrapper",
] as const;

export const financialDataComponents = Object.fromEntries(
  FINANCIAL_CHART_NAMES.map((name) => [
    name,
    // 実体の取得は FinancialChartLazy（クライアント側の遅延境界）が行う。
    // ここで next/dynamic を使うと 85 件全てがルートのクライアント参照になる。
    function FinancialChart() {
      return <FinancialChartLazy name={name} />;
    },
  ]),
) as MDXComponents;
