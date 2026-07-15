"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section51Data from "@/content/blog/2026-01-01-kakekin/data/section51.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section51ChartWrapper = createLineChartWrapper({
  data: section51Data,
  config: buildAutoChartConfig(section51Data),
});
