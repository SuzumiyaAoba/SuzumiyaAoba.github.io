"use client";

import { LineChart } from "@/components/Charts";
import section29Data from "@/contents/blog/2026-01-01-kakekin/data/section29.json";

export const Section29ChartWrapper: React.FC = () => {
  if (!section29Data) {
    return <div>データが見つかりません</div>;
  }

  const distributionLabelMap: Record<string, string> = {
    "借入金なし | ％": "借入金なし",
    "50万円未満 | ％": "50万円未満",
    "50～100万円未満 | ％": "50～100万円",
    "100～200万円未満 | ％": "100～200万円",
    "200～300万円未満 | ％": "200～300万円",
    "300～500万円未満 | ％": "300～500万円",
    "500～700万円未満 | ％": "500～700万円",
    "700～1000万円未満 | ％": "700～1000万円",
    "1000～1500万円未満 | ％": "1000～1500万円",
    "1500～2000万円未満 | ％": "1500～2000万円",
    "2000万円以上 | ％": "2000万円以上"
  };

  const avgLabelMap: Record<string, string> = {
    "平均 | 万円": "平均",
    "中央値 | 万円": "中央値"
  };

  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <h4>金額帯別分布</h4>
        <LineChart
          data={section29Data}
          groups={[]}
          excludeHeaders={["平均 | 万円", "中央値 | 万円"]}
          config={{
            yAxisMin: 0,
            yAxisMax: 100,
            yAxisLabel: "％",
            startYear: 2004,
            labelMap: distributionLabelMap
          }}
        />
      </div>
      <div>
        <h4>平均値・中央値</h4>
        <LineChart
          data={section29Data}
          groups={[]}
          excludeHeaders={[
            "借入金なし | ％",
            "50万円未満 | ％",
            "50～100万円未満 | ％",
            "100～200万円未満 | ％",
            "200～300万円未満 | ％",
            "300～500万円未満 | ％",
            "500～700万円未満 | ％",
            "700～1000万円未満 | ％",
            "1000～1500万円未満 | ％",
            "1500～2000万円未満 | ％",
            "2000万円以上 | ％"
          ]}
          config={{
            yAxisMin: 0,
            yAxisMax: 1000,
            yAxisLabel: "万円",
            startYear: 2004,
            labelMap: avgLabelMap
          }}
        />
      </div>
    </>
  );
};
