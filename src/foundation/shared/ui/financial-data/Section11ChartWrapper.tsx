"use client";

import { LineChart, type MetricGroup } from "@/shared/ui/financial-charts";
import section11Data from "@/content/blog/2026-01-01-kakekin/data/section11.json";

export const Section11ChartWrapper: React.FC = () => {
  if (!section11Data) {
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
    "その他 | ％": "その他",
  };

  const groups: MetricGroup[] = [
    {
      name: "収益性",
      metrics: ["収益性 | ％", "利回りが良いから | ％", "将来の値上がりが期待できるから | ％"],
    },
    {
      name: "安全性",
      metrics: [
        "安全性 | ％",
        "元本が保証されているから | ％",
        "取扱金融機関が信用できて安心だから | ％",
      ],
    },
    {
      name: "流動性",
      metrics: [
        "流動性 | ％",
        "現金に換えやすいから | ％",
        "少額でも預け入れや引き出しが自由にできるから | ％",
      ],
    },
    {
      name: "その他",
      metrics: ["商品内容が理解しやすいから | ％", "その他 | ％"],
    },
  ];

  return (
    <LineChart
      data={section11Data}
      groups={groups}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 50,
        yAxisLabel: "％",
        startYear: 2007,
        labelMap,
      }}
    />
  );
};
