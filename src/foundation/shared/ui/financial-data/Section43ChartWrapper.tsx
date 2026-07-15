"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section43Data from "@/content/blog/2026-01-01-kakekin/data/section43.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section43ChartWrapper = createLineChartWrapper({
  data: section43Data,
  config: buildAutoChartConfig(section43Data),
});
