"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section25Data from "@/content/blog/2026-01-01-kakekin/data/section25.json";

const labelMap: Record<string, string> = {
  "現金 | ％": "現金",
  "クレジットカード | ％": "クレジットカード",
  "電子マネー | ％": "電子マネー",
  "プリペイドカード | ％": "プリペイドカード",
  "口座振替 | ％": "口座振替",
  "その他 | ％": "その他",
};

export const Section25ChartWrapper = createLineChartWrapper({
  data: section25Data,
  config: {
    yAxisMin: 0,
    yAxisMax: 100,
    yAxisLabel: "％",
    startYear: 1991,
    labelMap,
  },
});
