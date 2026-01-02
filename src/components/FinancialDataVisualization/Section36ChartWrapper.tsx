"use client";

import { LineChart } from "@/components/Charts";
import section36Data from "@/contents/blog/2026-01-01-kakekin/data/section36.json";

export const Section36ChartWrapper: React.FC = () => {
  if (!section36Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "収益性 | ％": "収益性",
    "利回りが良い | ％": "利回り良",
    "値上がり期待 | ％": "値上がり期待",
    "安全性 | ％": "安全性",
    "元本保証 | ％": "元本保証",
    "金融機関が信用できる | ％": "機関信用",
    "流動性 | ％": "流動性",
    "現金に換えやすい | ％": "現金化容易",
    "預入・引出自由 | ％": "預入引出自由",
    "商品内容が理解しやすい | ％": "理解容易",
    "その他 | ％": "その他"
  };
  const startYear = Number(section36Data.metadata?.startYear ?? 2006);

  // グループ定義
  const groups = [
    {
      name: "収益性",
      metrics: [
        "収益性 | ％",
        "利回りが良い | ％",
        "値上がり期待 | ％"
      ]
    },
    {
      name: "安全性",
      metrics: [
        "安全性 | ％",
        "元本保証 | ％",
        "金融機関が信用できる | ％"
      ]
    },
    {
      name: "流動性",
      metrics: [
        "流動性 | ％",
        "現金に換えやすい | ％",
        "預入・引出自由 | ％"
      ]
    }
  ];

  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <h4>全体</h4>
        <LineChart
          data={section36Data}
          groups={groups}
          excludeHeaders={[]}
          config={{
            yAxisMin: 0,
            yAxisMax: 100,
            yAxisLabel: "％",
            startYear,
            labelMap
          }}
        />
      </div>
      <div style={{ marginBottom: "2rem" }}>
        <h4>主要3基準の推移</h4>
        <LineChart
          data={section36Data}
          groups={[]}
          excludeHeaders={[
            "利回りが良い | ％",
            "値上がり期待 | ％",
            "元本保証 | ％",
            "金融機関が信用できる | ％",
            "現金に換えやすい | ％",
            "預入・引出自由 | ％",
            "商品内容が理解しやすい | ％",
            "その他 | ％"
          ]}
          config={{
            yAxisMin: 0,
            yAxisMax: 100,
            yAxisLabel: "％",
            startYear,
            labelMap
          }}
        />
      </div>
    </>
  );
};
