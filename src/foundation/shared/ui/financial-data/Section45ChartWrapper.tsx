"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section45Data from "@/content/blog/2026-01-01-kakekin/data/section45.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section45ChartWrapper = createLineChartWrapper({
  data: section45Data,
  config: buildAutoChartConfig(section45Data),
});
