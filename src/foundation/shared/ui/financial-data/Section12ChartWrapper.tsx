"use client";

import { LineChart, type MetricGroup } from "@/shared/ui/financial-charts";
import section12Data from "@/content/blog/2026-01-01-kakekin/data/section12.json";

export const Section12ChartWrapper: React.FC = () => {
  if (!section12Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "元本割れの経験がある | ％": "経験あり",
    "元本割れの経験はない | ％": "経験なし",
    "自分の相場についての予想が外れたから仕方がない | ％": "予想が外れた",
    "自分がリスクをよく理解していなかったから仕方がない | ％": "リスク理解不足",
    "金融機関が十分に説明しなかったためだ | ％": "金融機関の説明不足",
    "著しい誤解を招く広告・勧誘を受けたためだ | ％": "誤解を招く広告・勧誘",
  };

  const groups: MetricGroup[] = [
    {
      name: "元本割れの経験",
      metrics: ["元本割れの経験がある | ％", "元本割れの経験はない | ％"],
    },
    {
      name: "受け止め方（経験がある世帯）",
      metrics: [
        "自分の相場についての予想が外れたから仕方がない | ％",
        "自分がリスクをよく理解していなかったから仕方がない | ％",
        "金融機関が十分に説明しなかったためだ | ％",
        "著しい誤解を招く広告・勧誘を受けたためだ | ％",
      ],
    },
  ];

  return (
    <LineChart
      data={section12Data}
      groups={groups}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 90,
        yAxisLabel: "％",
        startYear: 2000,
        labelMap,
      }}
    />
  );
};
