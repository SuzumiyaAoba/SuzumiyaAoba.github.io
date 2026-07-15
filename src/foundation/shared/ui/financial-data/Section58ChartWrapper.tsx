"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section58Data from "@/content/blog/2026-01-01-kakekin/data/section58.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section58ChartWrapper = createLineChartWrapper({
  data: section58Data,
  config: buildAutoChartConfig(section58Data),
});
