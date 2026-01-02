"use client";

import { LineChart } from "@/components/Charts";
import section38Data from "@/contents/blog/2026-01-01-kakekin/data/section38.json";

export const Section38ChartWrapper: React.FC = () => {
  if (!section38Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "元本割れ経験あり | ％": "経験あり",
    "元本割れ経験なし | ％": "経験なし",
    "相場予想が外れた | ％": "相場予想外れ",
    "リスク理解不足 | ％": "リスク理解不足",
    "金融機関の説明不足 | ％": "金融機関説明不足",
    "誤解招く広告・勧誘 | ％": "誤解招く広告"
  };
  const startYear = Number(section38Data.metadata?.startYear ?? 2006);

  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <h4>元本割れ経験の有無</h4>
        <LineChart
          data={section38Data}
          groups={[]}
          excludeHeaders={[
            "相場予想が外れた | ％",
            "リスク理解不足 | ％",
            "金融機関の説明不足 | ％",
            "誤解招く広告・勧誘 | ％"
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
      <div>
        <h4>元本割れ経験者の受け止め方</h4>
        <LineChart
          data={section38Data}
          groups={[]}
          excludeHeaders={[
            "元本割れ経験あり | ％",
            "元本割れ経験なし | ％"
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
