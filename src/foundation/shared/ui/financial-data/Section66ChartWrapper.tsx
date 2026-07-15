"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section66Data from "@/content/blog/2026-01-01-kakekin/data/section66.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section66ChartWrapper = createLineChartWrapper({
  data: section66Data,
  config: buildAutoChartConfig(section66Data),
});
