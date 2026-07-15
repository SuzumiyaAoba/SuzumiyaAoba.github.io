"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section53Data from "@/content/blog/2026-01-01-kakekin/data/section53.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section53ChartWrapper = createLineChartWrapper({
  data: section53Data,
  config: buildAutoChartConfig(section53Data),
});
