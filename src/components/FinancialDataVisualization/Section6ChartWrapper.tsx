"use client";

import { LineChart } from "@/components/Charts";
import section6Data from "@/contents/blog/2025-12-26-kakekin/data/section6.json";

export const Section6ChartWrapper: React.FC = () => {
  if (!section6Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "金融資産保有額 | 万円": "金融資産保有額",
    "預貯金（運用または将来の備え） | 万円": "預貯金",
    "うち決済用預金 | 万円": "決済用預金",
    "うち定期性預貯金 | 万円": "定期性預貯金",
    "郵便貯金 | 万円": "郵便貯金",
    "うち定期性貯金 | 万円": "定期性貯金",
    "金銭信託 | 万円": "金銭信託",
    "生命保険 | 万円": "生命保険",
    "損害保険 | 万円": "損害保険",
    "個人年金保険 | 万円": "個人年金保険",
    "債券 | 万円": "債券",
    "株式 | 万円": "株式",
    "投資信託 | 万円": "投資信託",
    "財形貯蓄 | 万円": "財形貯蓄",
    "その他金融商品 | 万円": "その他金融商品"
  };

  return (
    <LineChart
      data={section6Data}
      groups={[]}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 2000,
        yAxisLabel: "万円",
        startYear: 2004,
        labelMap
      }}
    />
  );
};
