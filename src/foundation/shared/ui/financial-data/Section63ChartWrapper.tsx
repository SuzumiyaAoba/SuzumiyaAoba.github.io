"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section63Data from "@/content/blog/2026-01-01-kakekin/data/section63.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section63ChartWrapper = createLineChartWrapper({
  data: section63Data,
  config: buildAutoChartConfig(section63Data),
});
