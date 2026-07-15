"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section65Data from "@/content/blog/2026-01-01-kakekin/data/section65.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section65ChartWrapper = createLineChartWrapper({
  data: section65Data,
  config: buildAutoChartConfig(section65Data),
});
