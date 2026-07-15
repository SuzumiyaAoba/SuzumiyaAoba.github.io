"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section64Data from "@/content/blog/2026-01-01-kakekin/data/section64.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section64ChartWrapper = createLineChartWrapper({
  data: section64Data,
  config: buildAutoChartConfig(section64Data),
});
