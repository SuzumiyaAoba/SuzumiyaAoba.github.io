"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import type { MetricGroup } from "@/shared/ui/financial-charts/types";
import section7Data from "@/content/blog/2026-01-01-kakekin/data/section7.json";

export const Section7ChartWrapper: React.FC = () => {
  if (!section7Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "新ＮＩＳＡ制度「つみたて投資枠」 | 万円": "新NISA つみたて投資枠",
    "新ＮＩＳＡ制度「成長投資枠」 | 万円": "新NISA 成長投資枠",
    "旧ＮＩＳＡ制度「一般ＮＩＳＡ」 | 万円": "一般NISA",
    "旧ＮＩＳＡ制度「ジュニアＮＩＳＡ」 | 万円": "ジュニアNISA",
    "旧ＮＩＳＡ制度「つみたてＮＩＳＡ」 | 万円": "つみたてNISA",
    "企業型確定拠出年金（企業型ＤＣ） | 万円": "企業型DC",
    "個人型確定拠出年金（ｉＤｅＣｏ） | 万円": "iDeCo",
    "外貨建金融商品残高合計 | 万円": "外貨建金融商品合計",
    "外貨預金 | 万円": "外貨預金",
    "外貨建投資信託 | 万円": "外貨建投資信託",
    "外貨建債券 | 万円": "外貨建債券",
    "外貨建株式 | 万円": "外貨建株式",
    "その他の外貨建金融商品 | 万円": "その他外貨建",
  };

  const groups: MetricGroup[] = [
    {
      name: "NISA・確定拠出年金",
      metrics: [
        "新ＮＩＳＡ制度「つみたて投資枠」 | 万円",
        "新ＮＩＳＡ制度「成長投資枠」 | 万円",
        "旧ＮＩＳＡ制度「一般ＮＩＳＡ」 | 万円",
        "旧ＮＩＳＡ制度「ジュニアＮＩＳＡ」 | 万円",
        "旧ＮＩＳＡ制度「つみたてＮＩＳＡ」 | 万円",
        "企業型確定拠出年金（企業型ＤＣ） | 万円",
        "個人型確定拠出年金（ｉＤｅＣｏ） | 万円",
      ],
    },
    {
      name: "外貨建金融商品",
      metrics: [
        "外貨建金融商品残高合計 | 万円",
        "外貨預金 | 万円",
        "外貨建投資信託 | 万円",
        "外貨建債券 | 万円",
        "外貨建株式 | 万円",
        "その他の外貨建金融商品 | 万円",
      ],
    },
  ];

  return (
    <LineChart
      data={section7Data}
      groups={groups}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 800,
        yAxisLabel: "万円",
        startYear: 1999,
        labelMap,
      }}
    />
  );
};
