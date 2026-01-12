"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section32Data from "@/content/blog/2026-01-01-kakekin/data/section32.json";

export const Section32ChartWrapper: React.FC = () => {
  if (!section32Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "金融資産保有額 | 万円": "金融資産保有額",
    "預貯金 | 万円": "預貯金",
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
    "財形貯蓄 | 万円": "財形貯蓄"
  };
  const startYear = Number(section32Data.metadata?.startYear ?? 2006);

  // グループ定義
  const groups = [
    {
      name: "預貯金関連",
      metrics: [
        "預貯金 | 万円",
        "うち決済用預金 | 万円",
        "うち定期性預貯金 | 万円",
        "郵便貯金 | 万円",
        "うち定期性貯金 | 万円"
      ]
    },
    {
      name: "保険関連",
      metrics: [
        "生命保険 | 万円",
        "損害保険 | 万円",
        "個人年金保険 | 万円"
      ]
    },
    {
      name: "有価証券関連",
      metrics: [
        "金銭信託 | 万円",
        "債券 | 万円",
        "株式 | 万円",
        "投資信託 | 万円"
      ]
    }
  ];

  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <h4>全体</h4>
        <LineChart
          data={section32Data}
          groups={groups}
          excludeHeaders={[]}
          config={{
            yAxisMin: 0,
            yAxisMax: 2500,
            yAxisLabel: "万円",
            startYear,
            labelMap
          }}
        />
      </div>
      <div style={{ marginBottom: "2rem" }}>
        <h4>主要項目のみ</h4>
        <LineChart
          data={section32Data}
          groups={[]}
          excludeHeaders={[
            "うち決済用預金 | 万円",
            "うち定期性預貯金 | 万円",
            "郵便貯金 | 万円",
            "うち定期性貯金 | 万円",
            "損害保険 | 万円"
          ]}
          config={{
            yAxisMin: 0,
            yAxisMax: 2500,
            yAxisLabel: "万円",
            startYear,
            labelMap
          }}
        />
      </div>
    </>
  );
};
