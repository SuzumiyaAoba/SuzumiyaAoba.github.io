"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section70Data from "@/content/blog/2026-01-01-kakekin/data/section70.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section70ChartWrapper = createLineChartWrapper({
  data: section70Data,
  config: buildAutoChartConfig(section70Data),
});
