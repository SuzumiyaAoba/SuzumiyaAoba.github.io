"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section16Data from "@/content/blog/2026-01-01-kakekin/data/section16.json";

export const Section16ChartWrapper: React.FC = () => {
  if (!section16Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "定例的な収入が 減ったので 金融資産を 取り崩したから | ％": "定例的な収入減少",
    "土地・住宅購入 費用の支出が あったから | ％": "土地・住宅購入",
    "耐久消費財 （自動車、家具、 家電等）購入 費用の支出が あったから | ％": "耐久消費財購入",
    "こどもの教育 費用、結婚費用の 支出があったから | ％": "教育・結婚費用",
    "旅行、レジャー 費用の支出が あったから | ％": "旅行・レジャー",
    "株式、債券価格の 低下により、 これらの評価額が 減少したから | ％": "株式・債券評価額下落",
    "扶養家族が 増えたから | ％": "扶養家族増加",
    "その他 | ％": "その他"
  };

  return (
    <LineChart
      data={section16Data}
      groups={[]}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 60,
        yAxisLabel: "％",
        startYear: 1989,
        labelMap
      }}
    />
  );
};
