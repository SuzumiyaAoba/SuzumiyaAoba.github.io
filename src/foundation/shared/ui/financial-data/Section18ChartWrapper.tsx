"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section18Data from "@/content/blog/2026-01-01-kakekin/data/section18.json";

export const Section18ChartWrapper: React.FC = () => {
  if (!section18Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "病気や不時の 災害への備え | ％": "病気・災害への備え",
    "こどもの教育資金 | ％": "こどもの教育資金",
    "こどもの結婚資金 | ％": "こどもの結婚資金",
    "住宅の取得または 増改築などの資金 | ％": "住宅取得・増改築",
    "老後の生活資金 | ％": "老後の生活資金",
    "耐久消費財の 購入資金 | ％": "耐久消費財購入",
    "旅行、レジャーの資金 | ％": "旅行・レジャー",
    "納税資金 | ％": "納税資金",
    "遺産として 子孫に残す | ％": "遺産として残す",
    "とくに目的はないが、 金融資産を保有 していれば安心 | ％": "目的なし（安心）",
    "その他 | ％": "その他",
  };

  return (
    <LineChart
      data={section18Data}
      groups={[]}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 70,
        yAxisLabel: "％",
        startYear: 2007,
        labelMap,
      }}
    />
  );
};
