"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section57Data from "@/content/blog/2026-01-01-kakekin/data/section57.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section57ChartWrapper = createLineChartWrapper({
  data: section57Data,
  config: buildAutoChartConfig(section57Data),
});
