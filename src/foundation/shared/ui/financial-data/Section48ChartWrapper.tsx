"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section48Data from "@/content/blog/2026-01-01-kakekin/data/section48.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section48ChartWrapper = createLineChartWrapper({
  data: section48Data,
  config: buildAutoChartConfig(section48Data),
});
