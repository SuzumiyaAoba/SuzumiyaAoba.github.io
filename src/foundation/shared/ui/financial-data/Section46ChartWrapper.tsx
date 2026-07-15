"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section46Data from "@/content/blog/2026-01-01-kakekin/data/section46.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section46ChartWrapper = createLineChartWrapper({
  data: section46Data,
  config: buildAutoChartConfig(section46Data),
});
