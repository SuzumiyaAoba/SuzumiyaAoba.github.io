"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section50Data from "@/content/blog/2026-01-01-kakekin/data/section50.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section50ChartWrapper = createLineChartWrapper({
  data: section50Data,
  config: buildAutoChartConfig(section50Data),
});
