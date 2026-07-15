"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section27Data from "@/content/blog/2026-01-01-kakekin/data/section27.json";

const labelMap: Record<string, string> = {
  "借入金がある | ％": "借入金がある",
  "借入金がない | ％": "借入金がない",
};

export const Section27ChartWrapper = createLineChartWrapper({
  data: section27Data,
  config: {
    yAxisMin: 0,
    yAxisMax: 100,
    yAxisLabel: "％",
    startYear: 1967,
    labelMap,
  },
});
