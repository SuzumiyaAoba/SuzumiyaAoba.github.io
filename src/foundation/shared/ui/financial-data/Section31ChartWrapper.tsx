"use client";

import { LineChart } from "@/shared/ui/financial-charts";
import section31Data from "@/content/blog/2026-01-01-kakekin/data/section31.json";

export const Section31ChartWrapper: React.FC = () => {
  if (!section31Data) {
    return <div>データが見つかりません</div>;
  }

  const distributionLabelMap: Record<string, string> = {
    "金融資産非保有 | ％": "非保有",
    "100万円未満 | ％": "100万円未満",
    "100～200万円未満 | ％": "100～200万円",
    "200～300万円未満 | ％": "200～300万円",
    "300～400万円未満 | ％": "300～400万円",
    "400～500万円未満 | ％": "400～500万円",
    "500～700万円未満 | ％": "500～700万円",
    "700～1000万円未満 | ％": "700～1000万円",
    "1000～1500万円未満 | ％": "1000～1500万円",
    "1500～2000万円未満 | ％": "1500～2000万円",
    "2000～3000万円未満 | ％": "2000～3000万円",
    "3000万円以上 | ％": "3000万円以上",
  };
  const startYear = Number(section31Data.metadata?.startYear ?? 2006);

  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <h4>金額帯別分布</h4>
        <LineChart
          data={section31Data}
          groups={[]}
          excludeHeaders={["平均 | 万円"]}
          config={{
            yAxisMin: 0,
            yAxisMax: 100,
            yAxisLabel: "％",
            startYear,
            labelMap: distributionLabelMap,
          }}
        />
      </div>
      <div>
        <h4>平均値</h4>
        <LineChart
          data={section31Data}
          groups={[]}
          excludeHeaders={[
            "金融資産非保有 | ％",
            "100万円未満 | ％",
            "100～200万円未満 | ％",
            "200～300万円未満 | ％",
            "300～400万円未満 | ％",
            "400～500万円未満 | ％",
            "500～700万円未満 | ％",
            "700～1000万円未満 | ％",
            "1000～1500万円未満 | ％",
            "1500～2000万円未満 | ％",
            "2000～3000万円未満 | ％",
            "3000万円以上 | ％",
          ]}
          config={{
            yAxisMin: 0,
            yAxisMax: 2000,
            yAxisLabel: "万円",
            startYear,
            labelMap: { "平均 | 万円": "平均" },
          }}
        />
      </div>
    </>
  );
};
