"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section60Data from "@/content/blog/2026-01-01-kakekin/data/section60.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section60ChartWrapper = createLineChartWrapper({
  data: section60Data,
  config: buildAutoChartConfig(section60Data),
});
