"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section59Data from "@/content/blog/2026-01-01-kakekin/data/section59.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section59ChartWrapper = createLineChartWrapper({
  data: section59Data,
  config: buildAutoChartConfig(section59Data),
});
