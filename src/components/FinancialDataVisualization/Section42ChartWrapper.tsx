"use client";

import { LineChart } from "@/components/Charts";
import section42Data from "@/contents/blog/2025-12-26-kakekin/data/section42.json";

const HEADERS = {
  overallCost: "老後のひと月当たり 最低予想生活費 | 万円",
  overallAssets: "年金支給時に 最低準備しておく 金融資産残高 | 万円",
  under60Cost: "世帯主の年令が60歳未満 老後のひと月 当たり最低予想 生活費 | 万円",
  under60Assets: "世帯主の年令が60歳未満 年金支給時に 最低準備 しておく 金融資産残高 | 万円",
  over60Cost: "世帯主の年令が 60歳以上 ひと月当たり 最低生活費 | 万円"
} as const;

export const Section42ChartWrapper: React.FC = () => {
  if (!section42Data) {
    return <div>データが見つかりません</div>;
  }

  const labelMap: Record<string, string> = {
    [HEADERS.overallCost]: "全体 生活費",
    [HEADERS.overallAssets]: "全体 必要資産",
    [HEADERS.under60Cost]: "60歳未満 生活費",
    [HEADERS.under60Assets]: "60歳未満 必要資産",
    [HEADERS.over60Cost]: "60歳以上 生活費"
  };

  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <h4>最低生活費（全体・年齢別）</h4>
        <LineChart
          data={section42Data}
          groups={[]}
          excludeHeaders={[HEADERS.overallAssets, HEADERS.under60Assets]}
          config={{
            yAxisMin: 0,
            yAxisMax: 60,
            yAxisLabel: "万円",
            startYear: 1994,
            labelMap
          }}
        />
      </div>
      <div>
        <h4>必要資産残高（全体・60歳未満）</h4>
        <LineChart
          data={section42Data}
          groups={[]}
          excludeHeaders={[HEADERS.overallCost, HEADERS.under60Cost, HEADERS.over60Cost]}
          config={{
            yAxisMin: 0,
            yAxisMax: 3000,
            yAxisLabel: "万円",
            startYear: 1994,
            labelMap
          }}
        />
      </div>
    </>
  );
};
