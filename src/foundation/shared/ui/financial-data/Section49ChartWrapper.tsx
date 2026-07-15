"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section49Data from "@/content/blog/2026-01-01-kakekin/data/section49.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section49ChartWrapper = createLineChartWrapper({
  data: section49Data,
  config: buildAutoChartConfig(section49Data),
});
