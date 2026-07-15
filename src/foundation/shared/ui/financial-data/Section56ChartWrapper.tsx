"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section56Data from "@/content/blog/2026-01-01-kakekin/data/section56.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section56ChartWrapper = createLineChartWrapper({
  data: section56Data,
  config: buildAutoChartConfig(section56Data),
});
