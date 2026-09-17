import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { UIEvent } from "react";
import { daysBetween } from "../model/release-calendar";
import type { Release } from "../model/release-calendar";
import {
  buildFlatTimelinePoints,
  buildTimelineRows,
} from "../model/release-timeline";
import type { ReleaseTimelineRange } from "../model/release-timeline";

export const SERIES_WIDTH = 176;
export const AXIS_PADDING = 24;
const ZOOM_LEVELS = [0.25, 0.5, 1, 2, 3, 6, 12];

/** 拡大率と表示幅から系列を配置し、スクロール中の時点を拡大・縮小後も保つ。 */
export function useReleaseTimelineLayout({
  range,
  releases,
  selectedDate,
}: {
  range: ReleaseTimelineRange;
  releases: Release[];
  selectedDate: string;
}) {
  const scrollRef = useRef<HTMLElement>(null);
  const [zoom, setZoom] = useState<number | "fit">(3);
  const [grouped, setGrouped] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(0);
  const showLabels = viewportWidth >= 640 && zoom !== "fit" && zoom >= 2;
  const seriesWidth = grouped ? SERIES_WIDTH : 0;
  const endPadding = showLabels ? 144 : AXIS_PADDING;
  const availableWidth = Math.max(
    1,
    viewportWidth - seriesWidth - AXIS_PADDING - endPadding
  );
  const plotWidth =
    zoom === "fit"
      ? availableWidth
      : Math.max(availableWidth, range.days * zoom);
  const pixelsPerDay = plotWidth / range.days;
  const targetWidth = showLabels ? 144 : 48;
  const rows = useMemo(
    () =>
      grouped ? buildTimelineRows(releases, pixelsPerDay, targetWidth) : [],
    [grouped, releases, pixelsPerDay, targetWidth]
  );
  const flat = useMemo(
    () =>
      grouped
        ? null
        : buildFlatTimelinePoints(releases, pixelsPerDay, targetWidth),
    [grouped, releases, pixelsPerDay, targetWidth]
  );
  const hasRows = grouped ? rows.length > 0 : (flat?.points.length ?? 0) > 0;
  const centerDayRef = useRef<number | null>(null);
  const previousLayout = useRef<{
    pixelsPerDay: number;
    viewportWidth: number;
    seriesWidth: number;
    start: string;
    selectedDate: string;
  } | null>(null);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() =>
      setViewportWidth(element.clientWidth)
    );
    setViewportWidth(element.clientWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasRows]);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element || !viewportWidth) {
      return;
    }
    const previous = previousLayout.current;
    const visibleWidth = viewportWidth - seriesWidth;
    if (!previous || previous.start !== range.start) {
      element.scrollLeft =
        AXIS_PADDING +
        daysBetween(range.start, selectedDate) * pixelsPerDay -
        visibleWidth / 2;
    } else if (
      previous.pixelsPerDay !== pixelsPerDay ||
      previous.viewportWidth !== viewportWidth ||
      previous.seriesWidth !== seriesWidth
    ) {
      // 拡大・縮小や画面幅の変更では、見ていた時点を画面中央に保つ。
      const centerDay =
        centerDayRef.current ?? daysBetween(range.start, selectedDate);
      element.scrollLeft =
        AXIS_PADDING + centerDay * pixelsPerDay - visibleWidth / 2;
    } else if (previous.selectedDate !== selectedDate) {
      const position =
        AXIS_PADDING + daysBetween(range.start, selectedDate) * pixelsPerDay;
      if (
        position < element.scrollLeft + 24 ||
        position > element.scrollLeft + visibleWidth - 24
      ) {
        element.scrollLeft = position - visibleWidth / 2;
      }
    }
    centerDayRef.current =
      (element.scrollLeft + visibleWidth / 2 - AXIS_PADDING) / pixelsPerDay;
    previousLayout.current = {
      pixelsPerDay,
      viewportWidth,
      seriesWidth,
      start: range.start,
      selectedDate,
    };
  }, [
    pixelsPerDay,
    viewportWidth,
    seriesWidth,
    range.start,
    selectedDate,
    hasRows,
  ]);

  function scrollToDate(date: string) {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    element.scrollLeft =
      AXIS_PADDING +
      daysBetween(range.start, date) * pixelsPerDay -
      (element.clientWidth - seriesWidth) / 2;
  }

  function scrollPage(direction: number) {
    const element = scrollRef.current;
    if (element) {
      element.scrollLeft +=
        direction * (element.clientWidth - seriesWidth) * 0.8;
    }
  }

  const smallerZoom = ZOOM_LEVELS.findLast(
    (value) => value < pixelsPerDay - 0.001
  );
  const largerZoom = ZOOM_LEVELS.find((value) => value > pixelsPerDay + 0.001);

  function handleScroll(event: UIEvent<HTMLElement>) {
    const element = event.currentTarget;
    centerDayRef.current =
      (element.scrollLeft +
        (element.clientWidth - seriesWidth) / 2 -
        AXIS_PADDING) /
      pixelsPerDay;
  }

  return {
    scrollRef,
    zoom,
    setZoom,
    grouped,
    setGrouped,
    showLabels,
    seriesWidth,
    endPadding,
    availableWidth,
    plotWidth,
    pixelsPerDay,
    rows,
    flat,
    hasRows,
    smallerZoom,
    largerZoom,
    scrollToDate,
    scrollPage,
    handleScroll,
  };
}
