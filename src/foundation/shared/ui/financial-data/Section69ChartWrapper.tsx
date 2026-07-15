"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section69Data from "@/content/blog/2026-01-01-kakekin/data/section69.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section69ChartWrapper = createLineChartWrapper({
  data: section69Data,
  config: buildAutoChartConfig(section69Data),
});
