"use client";

import { LineChart } from "@/components/Charts";
import type { MetricGroup } from "@/components/Charts/types";
import section10Data from "@/contents/blog/2025-12-26-kakekin/data/section10.json";

export const Section10ChartWrapper: React.FC = () => {
  if (!section10Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "収益性 | ％": "収益性",
    "利回りが良いから | ％": "利回り",
    "将来の値上がりが期待できるから | ％": "値上がり期待",
    "安全性 | ％": "安全性",
    "元本が保証されているから | ％": "元本保証",
    "取扱金融機関が信用できて安心だから | ％": "金融機関の信用",
    "流動性 | ％": "流動性",
    "現金に換えやすいから | ％": "現金換えやすさ",
    "少額でも預け入れや引き出しが自由にできるから | ％": "預入・引出自由",
    "商品内容が理解しやすいから | ％": "理解しやすさ",
    "その他 | ％": "その他"
  };

  const groups: MetricGroup[] = [
    {
      name: "収益性",
      metrics: [
        "収益性 | ％",
        "利回りが良いから | ％",
        "将来の値上がりが期待できるから | ％"
      ]
    },
    {
      name: "安全性",
      metrics: [
        "安全性 | ％",
        "元本が保証されているから | ％",
        "取扱金融機関が信用できて安心だから | ％"
      ]
    },
    {
      name: "流動性",
      metrics: [
        "流動性 | ％",
        "現金に換えやすいから | ％",
        "少額でも預け入れや引き出しが自由にできるから | ％"
      ]
    },
    {
      name: "その他",
      metrics: [
        "商品内容が理解しやすいから | ％",
        "その他 | ％"
      ]
    }
  ];

  return (
    <LineChart
      data={section10Data}
      groups={groups}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 65,
        yAxisLabel: "％",
        startYear: 1977,
        labelMap
      }}
    />
  );
};
