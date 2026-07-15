"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section14Data from "@/content/blog/2026-01-01-kakekin/data/section14.json";

const labelMap: Record<string, string> = {
  "増えた | ％": "増えた",
  "変わらない | ％": "変わらない",
  "減った | ％": "減った",
};

export const Section14ChartWrapper = createLineChartWrapper({
  data: section14Data,
  config: {
    yAxisMin: 0,
    yAxisMax: 60,
    yAxisLabel: "％",
    startYear: 2007,
    labelMap,
  },
});
