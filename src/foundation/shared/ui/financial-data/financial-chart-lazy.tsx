"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ComponentType } from "react";
import { isRecord } from "@/shared/lib/types/is-record";

function isChartComponent(value: unknown): value is ComponentType {
  return typeof value === "function";
}

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
        async () => {
          // webpackInclude が無いと financial-data 配下の
          // *.test.ts / *.stories.tsx まで context module に含まれ、
          // vitest や storybook がバンドルへ載る。
          const chartModule: unknown = await import(
            /* webpackInclude: /ChartWrapper\.tsx$/ */
            `./${name}`
          );
          const chart = isRecord(chartModule) ? chartModule[name] : undefined;
          if (!isChartComponent(chart)) {
            throw new TypeError(`Unknown chart component: ${name}`);
          }
          return chart;
        },
        { ssr: false },
      ),
    [name],
  );

  return <Chart />;
}
