"use client";

import { LineChart } from "@/components/Charts";
import section35Data from "@/contents/blog/2026-01-01-kakekin/data/section35.json";

export const Section35ChartWrapper: React.FC = () => {
  if (!section35Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    "現金・流動性預貯金→長期運用・リスク資産 | ％": "リスク資産へ移行",
    "長期運用・リスク資産→現金・流動性預貯金 | ％": "安全資産へ移行",
    "いずれにもあてはまらない | ％": "変更なし"
  };
  const startYear = Number(section35Data.metadata?.startYear ?? 2006);

  return (
    <LineChart
      data={section35Data}
      groups={[]}
      excludeHeaders={[]}
      config={{
        yAxisMin: 0,
        yAxisMax: 100,
        yAxisLabel: "％",
        startYear,
        labelMap
      }}
    />
  );
};
