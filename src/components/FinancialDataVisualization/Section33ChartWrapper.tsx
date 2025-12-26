"use client";

import { LineChart } from "@/components/Charts";
import section33Data from "@/contents/blog/2025-12-26-kakekin/data/section33.json";

export const Section33ChartWrapper: React.FC = () => {
  if (!section33Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "新NISA つみたて投資枠 | 万円": "新NISA つみたて",
    "新NISA 成長投資枠 | 万円": "新NISA 成長",
    "旧NISA 一般NISA | 万円": "旧NISA 一般",
    "旧NISA ジュニアNISA | 万円": "旧NISA ジュニア",
    "旧NISA つみたてNISA | 万円": "旧NISA つみたて",
    "企業型DC | 万円": "企業型DC",
    "iDeCo | 万円": "iDeCo",
    "外貨建金融商品合計 | 万円": "外貨建合計",
    "外貨預金 | 万円": "外貨預金",
    "外貨建投資信託 | 万円": "外貨建投信",
    "外貨建債券 | 万円": "外貨建債券",
    "外貨建株式 | 万円": "外貨建株式",
    "その他外貨建金融商品 | 万円": "その他外貨建"
  };
  const startYear = Number(section33Data.metadata?.startYear ?? 2006);

  // グループ定義
  const groups = [
    {
      name: "NISA関連",
      metrics: [
        "新NISA つみたて投資枠 | 万円",
        "新NISA 成長投資枠 | 万円",
        "旧NISA 一般NISA | 万円",
        "旧NISA ジュニアNISA | 万円",
        "旧NISA つみたてNISA | 万円"
      ]
    },
    {
      name: "確定拠出年金関連",
      metrics: [
        "企業型DC | 万円",
        "iDeCo | 万円"
      ]
    },
    {
      name: "外貨建金融商品関連",
      metrics: [
        "外貨建金融商品合計 | 万円",
        "外貨預金 | 万円",
        "外貨建投資信託 | 万円",
        "外貨建債券 | 万円",
        "外貨建株式 | 万円",
        "その他外貨建金融商品 | 万円"
      ]
    }
  ];

  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <h4>全体</h4>
        <LineChart
          data={section33Data}
          groups={groups}
          excludeHeaders={[]}
          config={{
            yAxisMin: 0,
            yAxisMax: 800,
            yAxisLabel: "万円",
            startYear,
            labelMap
          }}
        />
      </div>
      <div style={{ marginBottom: "2rem" }}>
        <h4>NISA関連のみ</h4>
        <LineChart
          data={section33Data}
          groups={[]}
          excludeHeaders={[
            "企業型DC | 万円",
            "iDeCo | 万円",
            "外貨建金融商品合計 | 万円",
            "外貨預金 | 万円",
            "外貨建投資信託 | 万円",
            "外貨建債券 | 万円",
            "外貨建株式 | 万円",
            "その他外貨建金融商品 | 万円"
          ]}
          config={{
            yAxisMin: 0,
            yAxisMax: 300,
            yAxisLabel: "万円",
            startYear,
            labelMap
          }}
        />
      </div>
      <div style={{ marginBottom: "2rem" }}>
        <h4>確定拠出年金のみ</h4>
        <LineChart
          data={section33Data}
          groups={[]}
          excludeHeaders={[
            "新NISA つみたて投資枠 | 万円",
            "新NISA 成長投資枠 | 万円",
            "旧NISA 一般NISA | 万円",
            "旧NISA ジュニアNISA | 万円",
            "旧NISA つみたてNISA | 万円",
            "外貨建金融商品合計 | 万円",
            "外貨預金 | 万円",
            "外貨建投資信託 | 万円",
            "外貨建債券 | 万円",
            "外貨建株式 | 万円",
            "その他外貨建金融商品 | 万円"
          ]}
          config={{
            yAxisMin: 0,
            yAxisMax: 800,
            yAxisLabel: "万円",
            startYear,
            labelMap
          }}
        />
      </div>
      <div>
        <h4>外貨建金融商品（内訳）</h4>
        <LineChart
          data={section33Data}
          groups={[]}
          excludeHeaders={[
            "新NISA つみたて投資枠 | 万円",
            "新NISA 成長投資枠 | 万円",
            "旧NISA 一般NISA | 万円",
            "旧NISA ジュニアNISA | 万円",
            "旧NISA つみたてNISA | 万円",
            "企業型DC | 万円",
            "iDeCo | 万円",
            "外貨建金融商品合計 | 万円"
          ]}
          config={{
            yAxisMin: 0,
            yAxisMax: 250,
            yAxisLabel: "万円",
            startYear,
            labelMap
          }}
        />
      </div>
    </>
  );
};
