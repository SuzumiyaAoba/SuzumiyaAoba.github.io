"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChartConfig, MetricGroup, SheetData } from "./types";

const EMPTY_GROUPS: MetricGroup[] = [];
const EMPTY_HEADERS: string[] = [];
const EMPTY_LABEL_MAP: Record<string, string> = {};

export function useChartMetrics({
  data,
  groups = EMPTY_GROUPS,
  excludeHeaders = EMPTY_HEADERS,
  labelMap = EMPTY_LABEL_MAP,
}: {
  data: SheetData;
  groups: MetricGroup[] | undefined;
  excludeHeaders: string[] | undefined;
  labelMap: ChartConfig["labelMap"];
}) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const availableMetrics = useMemo(
    () =>
      data.headers.filter(
        (header) =>
          !excludeHeaders.includes(header) &&
          data.series.some((row) => row.values[header] !== null),
      ),
    [data.headers, data.series, excludeHeaders],
  );
  const effectiveGroups = useMemo(
    () => (groups.length > 0 ? groups : [{ name: "", metrics: availableMetrics }]),
    [groups, availableMetrics],
  );

  useEffect(() => {
    if (selectedMetrics.length === 0 && availableMetrics.length > 0) {
      setSelectedMetrics(availableMetrics);
    }
  }, [availableMetrics, selectedMetrics.length]);

  const getLabel = useCallback(
    (metric: string) =>
      labelMap[metric] ||
      metric
        .split("|")
        .map((part) => part.trim())
        .filter((part) => part && part !== "％")
        .join(""),
    [labelMap],
  );

  const toggleMetric = useCallback((metric: string) => {
    setSelectedMetrics((previous) =>
      previous.includes(metric)
        ? previous.filter((item) => item !== metric)
        : [...previous, metric],
    );
  }, []);

  const toggleGroup = useCallback((metrics: string[]) => {
    setSelectedMetrics((previous) =>
      metrics.every((metric) => previous.includes(metric))
        ? previous.filter((metric) => !metrics.includes(metric))
        : [...new Set([...previous, ...metrics])],
    );
  }, []);

  return {
    availableMetrics,
    effectiveGroups,
    selectedMetrics,
    getLabel,
    toggleMetric,
    toggleGroup,
  };
}
