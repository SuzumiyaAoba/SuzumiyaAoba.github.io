"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section24Data from "@/content/blog/2026-01-01-kakekin/data/section24.json";

const labelMap: Record<string, string> = {
  "10,000円超50,000円以下：現金 | ％": "10,000～50,000円：現金",
  "10,000円超50,000円以下：クレジットカード | ％": "10,000～50,000円：カード",
  "10,000円超50,000円以下：電子マネー | ％": "10,000～50,000円：電子マネー",
  "10,000円超50,000円以下：その他 | ％": "10,000～50,000円：その他",
  "50,000円超：現金 | ％": "50,000円超：現金",
  "50,000円超：クレジットカード | ％": "50,000円超：カード",
  "50,000円超：電子マネー | ％": "50,000円超：電子マネー",
  "50,000円超：その他 | ％": "50,000円超：その他",
};

export const Section24ChartWrapper = createLineChartWrapper({
  data: section24Data,
  config: {
    yAxisMin: 0,
    yAxisMax: 90,
    yAxisLabel: "％",
    startYear: 2007,
    labelMap,
  },
});
