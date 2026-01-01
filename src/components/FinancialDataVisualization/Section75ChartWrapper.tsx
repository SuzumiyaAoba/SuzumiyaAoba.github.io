"use client";

import { LineChart } from "@/components/Charts";
import section75Data from "@/contents/blog/2025-12-26-kakekin/data/section75.json";
import { buildAutoChartConfig } from "@/components/FinancialDataVisualization/sectionChartUtils";

export const Section75ChartWrapper: React.FC = () => {
  if (!section75Data) {
    return <div>データが見つかりません</div>;
  }

  return (
    <>
      <div style={{ marginBottom: "2rem" }}>
        <h4>金額帯別分布</h4>
        <LineChart
          data={section75Data}
          groups={[]}
          excludeHeaders={["平均 | 万円", "中央値 | 万円"]}
          config={buildAutoChartConfig(section75Data)}
        />
      </div>
      <div>
        <h4>平均・中央値</h4>
        <LineChart
          data={section75Data}
          groups={[]}
          excludeHeaders={[
            "収入はない | ％",
            "300万円未満 | ％",
            "300～500万円未満 | ％",
            "400～500万円未満 | ％",
            "500～750万円未満 | ％",
            "750～1000万円未満 | ％",
            "1000～1200万円未満 | ％",
            "1200万円以上 | ％"
          ]}
          config={{
            yAxisMin: 0,
            yAxisMax: 700,
            yAxisLabel: "万円",
            startYear: Number(section75Data.metadata?.startYear ?? 2006),
            labelMap: { "平均 | 万円": "平均", "中央値 | 万円": "中央値" }
          }}
        />
      </div>
    </>
  );
};
