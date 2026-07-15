"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section15Data from "@/content/blog/2026-01-01-kakekin/data/section15.json";

const labelMap: Record<string, string> = {
  "定例的な収入が増加したから | ％": "定例的な収入増加",
  "定例的な収入から貯蓄する割合を引き上げたから | ％": "貯蓄割合引き上げ",
  "配当や金利収入があったから | ％": "配当・金利収入",
  "土地・住宅等の実物資産の売却による収入があったから | ％": "実物資産売却",
  "相続、退職金等による臨時収入があったから | ％": "相続・退職金",
  "株式、債券価格の上昇により、これらの評価額が増加したから | ％": "株式・債券評価額上昇",
  "扶養家族が減ったから | ％": "扶養家族減少",
  "その他 | ％": "その他",
};

export const Section15ChartWrapper = createLineChartWrapper({
  data: section15Data,
  config: {
    yAxisMin: 0,
    yAxisMax: 60,
    yAxisLabel: "％",
    startYear: 1989,
    labelMap,
  },
});
