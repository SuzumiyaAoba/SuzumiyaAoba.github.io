"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section52Data from "@/content/blog/2026-01-01-kakekin/data/section52.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section52ChartWrapper = createLineChartWrapper({
  data: section52Data,
  config: buildAutoChartConfig(section52Data),
});
