"use client";

import { type MetricGroup } from "@/shared/ui/financial-charts";
import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section13Data from "@/content/blog/2026-01-01-kakekin/data/section13.json";

const labelMap: Record<string, string> = {
  "増えた | ％": "増えた",
  "非常に増えた | ％": "非常に増えた",
  "若干増えた | ％": "若干増えた",
  "変わらない | ％": "変わらない",
  "減った | ％": "減った",
  "若干減った | ％": "若干減った",
  "非常に減った | ％": "非常に減った",
};

const groups: MetricGroup[] = [
  {
    name: "増加",
    metrics: ["増えた | ％", "非常に増えた | ％", "若干増えた | ％"],
  },
  {
    name: "変化なし",
    metrics: ["変わらない | ％"],
  },
  {
    name: "減少",
    metrics: ["減った | ％", "若干減った | ％", "非常に減った | ％"],
  },
];

export const Section13ChartWrapper = createLineChartWrapper({
  data: section13Data,
  groups: groups,
  config: {
    yAxisMin: 0,
    yAxisMax: 60,
    yAxisLabel: "％",
    startYear: 1988,
    labelMap,
  },
});
