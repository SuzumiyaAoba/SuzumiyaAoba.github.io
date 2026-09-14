"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section35Data from "@/content/blog/2026-01-01-kakekin/data/section35.json";

const labelMap: Record<string, string> = {
  "現金・流動性預貯金→長期運用・リスク資産 | ％": "リスク資産へ移行",
  "長期運用・リスク資産→現金・流動性預貯金 | ％": "安全資産へ移行",
  "いずれにもあてはまらない | ％": "変更なし",
};
const startYear = Number(section35Data.metadata.startYear);

export const Section35ChartWrapper = createLineChartWrapper({
  data: section35Data,
  config: {
    yAxisMin: 0,
    yAxisMax: 100,
    yAxisLabel: "％",
    startYear,
    labelMap,
  },
});
