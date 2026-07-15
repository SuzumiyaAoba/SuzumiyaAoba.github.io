"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section71Data from "@/content/blog/2026-01-01-kakekin/data/section71.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section71ChartWrapper = createLineChartWrapper({
  data: section71Data,
  config: buildAutoChartConfig(section71Data),
});
