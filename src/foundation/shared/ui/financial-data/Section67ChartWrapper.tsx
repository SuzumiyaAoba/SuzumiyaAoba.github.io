"use client";

import { createLineChartWrapper } from "./_shared/line-chart-wrapper";
import section67Data from "@/content/blog/2026-01-01-kakekin/data/section67.json";
import { buildAutoChartConfig } from "@/shared/ui/financial-data/sectionChartUtils";

export const Section67ChartWrapper = createLineChartWrapper({
  data: section67Data,
  config: buildAutoChartConfig(section67Data),
});
