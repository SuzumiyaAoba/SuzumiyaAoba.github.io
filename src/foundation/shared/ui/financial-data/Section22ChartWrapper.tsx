"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section22Data from "@/content/blog/2026-01-01-kakekin/data/section22.json";

const labelMap: Record<string, string> = {
  "積極的に保有しようと思っている | ％": "積極的に保有",
  "一部は保有しようと思っている | ％": "一部は保有",
  "保有しようとは全く思わない | ％": "全く思わない",
};

export const Section22ChartWrapper = createLineChartWrapper({
  data: section22Data,
  config: {
    yAxisMin: 0,
    yAxisMax: 90,
    yAxisLabel: "％",
    startYear: 2007,
    labelMap,
  },
});
