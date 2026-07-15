"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section44Data from "@/content/blog/2026-01-01-kakekin/data/section44.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section44ChartWrapper = createLineChartWrapper({
  data: section44Data,
  config: buildAutoChartConfig(section44Data),
});
