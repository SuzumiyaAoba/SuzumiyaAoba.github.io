"use client";

import { useMemo } from "react";

import { StackedAreaChart } from "@/shared/ui/financial-charts";
import type { SheetData } from "@/shared/ui/financial-charts";

type Props = {
  data: SheetData;
};

const GROUP_HEADERS = new Set([
  "口座の有無 （注１） | 口座を保有 している | ％",
  "現在保有している金融商品 | 預貯金 （ゆうちょ銀行の貯金を含む） | ％",
]);

/**
 * Sheet1(預貯金口座または証券会社等の口座の有無、現在保有している金融商品)を
 * 帯グラフ(積み上げエリアチャート)として表示する。データ整形のみを担い、
 * d3描画ロジックは financial-charts/StackedAreaChart に委譲する。
 */
export const Sheet1StackedChart: React.FC<Props> = ({ data }) => {
  // データがあるメトリクスを取得（グループヘッダーを除外）
  const availableMetrics = useMemo(
    () =>
      data.headers.filter(
        (header) =>
          !GROUP_HEADERS.has(header) &&
          data.series.some((s) => s.values[header] !== null)
      ),
    [data]
  );

  // グループ情報を作成
  const groups = useMemo(
    () => [
      {
        name: "口座の有無（注１）",
        metrics: availableMetrics.filter((m) => {
          const headerIdx = data.headers.indexOf(m);
          return headerIdx > 0 && headerIdx < 5;
        }),
      },
      {
        name: "現在保有している金融商品",
        metrics: availableMetrics.filter((m) => {
          const headerIdx = data.headers.indexOf(m);
          return headerIdx >= 6;
        }),
      },
    ],
    [availableMetrics, data.headers]
  );

  const title = `${data.metadata.title.replace(/^1[\s.、]*/u, "")}（帯グラフ）`;

  return (
    <StackedAreaChart
      data={data}
      groups={groups}
      availableMetrics={availableMetrics}
      title={title}
    />
  );
};
