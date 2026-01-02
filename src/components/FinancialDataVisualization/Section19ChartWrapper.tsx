"use client";

import { LineChart } from "@/components/Charts";
import section19Data from "@/contents/blog/2026-01-01-kakekin/data/section19.json";

export const Section19ChartWrapper: React.FC = () => {
  if (!section19Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "老後の世話をしてくれる ならば、こどもに財産 を残してやりたい | ％": "老後の世話条件で残す",
    "家業を継いでくれる ならば、こどもに財産 を残してやりたい | ％": "家業継承条件で残す",
    "老後の世話をして くれるか、家業を継ぐか 等に関わらずこどもに 財産を残してやりたい | ％": "無条件で残す",
    "財産を当てにして働かな くなるといけないので、 社会・公共の役に 立つようにしたい | ％": "社会貢献（働かなくなる懸念）",
    "財産を残すこどもが いないので、社会・公共 の役に立つようにしたい | ％": "社会貢献（子なし）",
    "財産を残すこどもが いないうえ、自分たちの 人生を楽しみたいので、 財産を使い切りたい | ％": "使い切る（子なし）",
    "こどもはいるが、 自分たちの人生を 楽しみたいので、 財産を使い切りたい | ％": "使い切る（子あり）",
    "その他 | ％": "その他"
  };

  return (
    <LineChart
      data={section19Data}
      groups={[]}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 50,
        yAxisLabel: "％",
        startYear: 2007,
        labelMap
      }}
    />
  );
};
