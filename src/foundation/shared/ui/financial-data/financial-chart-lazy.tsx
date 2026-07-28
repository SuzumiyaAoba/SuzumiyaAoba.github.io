"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

type FinancialChartLazyProps = {
  /** 読み込むラッパーコンポーネント名（例: "Section31ChartWrapper"） */
  name: string;
};

/**
 * financial-data のチャートラッパーを名前で遅延読み込みする単一の境界。
 *
 * 85 件それぞれを next/dynamic でサーバー側から参照すると、全てが
 * ルートのクライアント参照として登録され、チャートを使わない記事にも
 * 約 115KB(gzip) が初期ロードで載ってしまう。
 * クライアントコンポーネントの内側で分割することで、実際に描画される
 * チャートだけが実行時に取得される。
 */
export function FinancialChartLazy({ name }: FinancialChartLazyProps) {
  const Chart = useMemo(
    () =>
      dynamic(
        () =>
          // webpackInclude が無いと financial-data 配下の
          // *.test.ts / *.stories.tsx まで context module に含まれ、
          // vitest や storybook がバンドルへ載る。
          import(
            /* webpackInclude: /ChartWrapper\.tsx$/ */
            `./${name}`
          ).then((mod) => mod[name] as React.ComponentType),
        { ssr: false },
      ),
    [name],
  );

  return <Chart />;
}
