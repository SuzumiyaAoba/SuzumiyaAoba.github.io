"use client";

import { useCallback, useMemo, useState } from "react";
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
  // 非表示にした項目だけを保持し、全解除と初期状態を区別する。
  const [hiddenMetrics, setHiddenMetrics] = useState<Set<string>>(
    () => new Set()
  );
  const availableMetrics = useMemo(() => {
    const excludeSet = new Set(excludeHeaders);
    return data.headers.filter(
      (header) =>
        !excludeSet.has(header) &&
        data.series.some((row) => Number.isFinite(row.values[header]))
    );
  }, [data.headers, data.series, excludeHeaders]);
  const effectiveGroups = useMemo(() => {
    const availableSet = new Set(availableMetrics);
    return groups.length > 0
      ? groups.map((group) => ({
          ...group,
          metrics: group.metrics.filter((metric) => availableSet.has(metric)),
        }))
      : [{ name: "", metrics: availableMetrics }];
  }, [groups, availableMetrics]);

  const selectedMetrics = useMemo(
    () => availableMetrics.filter((metric) => !hiddenMetrics.has(metric)),
    [availableMetrics, hiddenMetrics]
  );

  const getLabel = useCallback(
    (metric: string) =>
      labelMap[metric] ||
      metric
        .split("|")
        .map((part) => part.trim())
        .filter((part) => part !== "" && part !== "％")
        .join(""),
    [labelMap]
  );

  const toggleMetric = useCallback((metric: string) => {
    setHiddenMetrics((previous) => {
      const next = new Set(previous);
      if (next.has(metric)) {
        next.delete(metric);
      } else {
        next.add(metric);
      }
      return next;
    });
  }, []);

  const toggleGroup = useCallback((metrics: string[]) => {
    setHiddenMetrics((previous) => {
      const allSelected = metrics.every((metric) => !previous.has(metric));
      const next = new Set(previous);
      for (const metric of metrics) {
        if (allSelected) {
          next.add(metric);
        } else {
          next.delete(metric);
        }
      }
      return next;
    });
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
