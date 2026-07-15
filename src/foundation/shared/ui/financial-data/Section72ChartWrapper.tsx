"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section72Data from "@/content/blog/2026-01-01-kakekin/data/section72.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section72ChartWrapper = createLineChartWrapper({
  data: section72Data,
  config: buildAutoChartConfig(section72Data),
});
