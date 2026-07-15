"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section55Data from "@/content/blog/2026-01-01-kakekin/data/section55.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section55ChartWrapper = createLineChartWrapper({
  data: section55Data,
  config: buildAutoChartConfig(section55Data),
});
