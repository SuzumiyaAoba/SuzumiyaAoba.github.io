"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section61Data from "@/content/blog/2026-01-01-kakekin/data/section61.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section61ChartWrapper = createLineChartWrapper({
  data: section61Data,
  config: buildAutoChartConfig(section61Data),
});
