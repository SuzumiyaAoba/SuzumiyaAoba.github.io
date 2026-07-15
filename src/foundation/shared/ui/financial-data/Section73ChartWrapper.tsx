"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section73Data from "@/content/blog/2026-01-01-kakekin/data/section73.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section73ChartWrapper = createLineChartWrapper({
  data: section73Data,
  config: buildAutoChartConfig(section73Data),
});
