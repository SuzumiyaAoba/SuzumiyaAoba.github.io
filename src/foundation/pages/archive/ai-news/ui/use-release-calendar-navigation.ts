import { useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, UIEvent } from "react";
import {
  dateTimestamp,
  isExactDate,
  shiftMonth,
} from "../model/release-calendar";
import { shiftDate } from "../model/release-activity";
import {
  dateInMonth,
  getMonthWindow,
  monthsBetween,
} from "../model/release-months";
import type { ReleaseTimelineRange } from "../model/release-timeline";

export const CALENDAR_MONTH_GAP = 16;

/** 表示中の月とフォーカスを保ちながら、移動先に応じて描画期間を広げる。 */
export function useReleaseCalendarNavigation({
  range,
  today,
  selectedDate,
  onSelectDate,
}: {
  range: ReleaseTimelineRange | null;
  today: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const scrollRef = useRef<HTMLElement>(null);
  const [extent, setExtent] = useState(() => ({
    start: shiftMonth(
      (range && range.firstDate < today ? range.firstDate : today).slice(0, 7),
      -12
    ),
    end: shiftMonth(
      (range && range.lastDate > today ? range.lastDate : today).slice(0, 7),
      24
    ),
  }));
  const [viewport, setViewport] = useState({ left: 0, width: 0 });
  const monthWidth =
    viewport.width >= 1180
      ? Math.floor((viewport.width - CALENDAR_MONTH_GAP * 3) / 2)
      : Math.max(252, Math.min(760, viewport.width - CALENDAR_MONTH_GAP * 2));
  const monthStep = monthWidth + CALENDAR_MONTH_GAP;
  const anchorRef = useRef({ month: selectedDate.slice(0, 7), offset: 0 });
  const pendingFocusRef = useRef<string | null>(null);
  const [target, setTarget] = useState(0);
  const calendar = getMonthWindow(
    extent.start,
    extent.end,
    viewport.left,
    viewport.width,
    monthStep
  );
  const visibleMonth = shiftMonth(
    extent.start,
    Math.round(viewport.left / monthStep)
  );

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    const measure = () =>
      setViewport((current) => ({ ...current, width: element.clientWidth }));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    // 前の期間の追加や画面幅の変更でも、見ていた月を保つ。
    element.scrollLeft =
      (monthsBetween(extent.start, anchorRef.current.month) +
        anchorRef.current.offset) *
      monthStep;
    setViewport({ left: element.scrollLeft, width: element.clientWidth });
  }, [target, extent.start, monthStep]);

  useLayoutEffect(() => {
    if (pendingFocusRef.current) {
      const button = scrollRef.current?.querySelector<HTMLButtonElement>(
        `[data-calendar-date="${pendingFocusRef.current}"]`
      );
      if (button) {
        button.focus({ preventScroll: true });
        pendingFocusRef.current = null;
      }
    }
  }, [target, calendar.first, monthStep]);

  function jumpTo(date: string, focus = false) {
    if (!isExactDate(date)) {
      return;
    }
    const month = date.slice(0, 7);
    anchorRef.current = { month, offset: 0 };
    setExtent((current) => ({
      start: month < current.start ? shiftMonth(month, -12) : current.start,
      end: month > current.end ? shiftMonth(month, 24) : current.end,
    }));
    pendingFocusRef.current = focus ? date : null;
    setTarget((current) => current + 1);
    onSelectDate(date);
  }

  function jumpToMonth(month: string) {
    jumpTo(month === today.slice(0, 7) ? today : `${month}-01`);
  }

  function handleDayKey(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    const weekday = new Date(dateTimestamp(date)).getUTCDay();
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -weekday,
      End: 6 - weekday,
    };
    const offset = offsets[event.key];
    if (offset !== undefined) {
      event.preventDefault();
      jumpTo(shiftDate(date, offset), true);
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      jumpTo(
        dateInMonth(
          date,
          shiftMonth(date.slice(0, 7), event.key === "PageUp" ? -1 : 1)
        ),
        true
      );
    }
  }

  function handleScroll(event: UIEvent<HTMLElement>) {
    const element = event.currentTarget;
    const position = element.scrollLeft / monthStep;
    anchorRef.current = {
      month: shiftMonth(extent.start, Math.floor(position)),
      offset: position % 1,
    };
    setViewport({ left: element.scrollLeft, width: element.clientWidth });
    if (element.scrollLeft < monthStep * 2) {
      setExtent((current) => ({
        ...current,
        start: shiftMonth(current.start, -12),
      }));
    } else if (
      element.scrollWidth - element.scrollLeft - element.clientWidth <
      monthStep * 2
    ) {
      setExtent((current) => ({
        ...current,
        end: shiftMonth(current.end, 12),
      }));
    }
  }

  return {
    scrollRef,
    monthWidth,
    monthStep,
    calendar,
    visibleMonth,
    jumpTo,
    jumpToMonth,
    handleDayKey,
    handleScroll,
  };
}
