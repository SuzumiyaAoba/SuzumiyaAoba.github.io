"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section40Data from "@/content/blog/2026-01-01-kakekin/data/section40.json";

const labelMap: Record<string, string> = {
  "取得ないし 増改築した | ％": "取得・増改築",
  "売却した | ％": "売却",
  "取得ないし 増改築し、 売却もした | ％": "取得・増改築＋売却",
  "取得、増改築、 売却ともに していない | ％": "いずれもなし",
};

export const Section40ChartWrapper = createLineChartWrapper({
  data: section40Data,
  config: {
    yAxisMin: 0,
    yAxisMax: 100,
    yAxisLabel: "％",
    startYear: 2007,
    labelMap,
  },
});
