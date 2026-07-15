"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section62Data from "@/content/blog/2026-01-01-kakekin/data/section62.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section62ChartWrapper = createLineChartWrapper({
  data: section62Data,
  config: buildAutoChartConfig(section62Data),
});
