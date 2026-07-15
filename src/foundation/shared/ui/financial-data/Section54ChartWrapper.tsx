"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section54Data from "@/content/blog/2026-01-01-kakekin/data/section54.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section54ChartWrapper = createLineChartWrapper({
  data: section54Data,
  config: buildAutoChartConfig(section54Data),
});
