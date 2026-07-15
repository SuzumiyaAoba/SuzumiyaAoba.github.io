"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section74Data from "@/content/blog/2026-01-01-kakekin/data/section74.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section74ChartWrapper = createLineChartWrapper({
  data: section74Data,
  config: buildAutoChartConfig(section74Data),
});
