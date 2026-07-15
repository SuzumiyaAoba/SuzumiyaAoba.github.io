"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section47Data from "@/content/blog/2026-01-01-kakekin/data/section47.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section47ChartWrapper = createLineChartWrapper({
  data: section47Data,
  config: buildAutoChartConfig(section47Data),
});
