"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section68Data from "@/content/blog/2026-01-01-kakekin/data/section68.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section68ChartWrapper = createLineChartWrapper({
  data: section68Data,
  config: buildAutoChartConfig(section68Data),
});
