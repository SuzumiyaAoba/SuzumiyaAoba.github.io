import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, CornerUpLeft } from "lucide-react";
import type { Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  dateTimestamp,
  formatReleaseDate,
  isExactDate,
  shiftMonth,
  type Release,
} from "../model/release-calendar";
import { shiftDate } from "../model/release-activity";
import { dateInMonth, getMonthDays, getMonthWindow, monthsBetween } from "../model/release-months";
import type { ReleaseTimelineRange } from "../model/release-timeline";
import { ProviderIcon, providerStyles } from "./provider-identity";
import { ReleaseDatePicker } from "./release-date-picker";
import type { ReleasePopoverControls } from "./release-popover";
import { ReleaseScrollArea, ReleaseViewHeader, releaseActionClass } from "./release-view-layout";

const MONTH_GAP = 16;

export function ReleaseCalendarStrip({
  releases,
  range,
  today,
  selectedDate,
  onSelectDate,
  locale,
  popover,
}: {
  releases: Release[];
  range: ReleaseTimelineRange | null;
  today: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  locale: Locale;
  popover: ReleasePopoverControls;
}) {
  const en = locale === "en";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [extent, setExtent] = useState(() => ({
    start: shiftMonth(
      (range && range.firstDate < today ? range.firstDate : today).slice(0, 7),
      -12,
    ),
    end: shiftMonth((range && range.lastDate > today ? range.lastDate : today).slice(0, 7), 24),
  }));
  const [viewport, setViewport] = useState({ left: 0, width: 0 });
  const monthWidth =
    viewport.width >= 1180
      ? Math.floor((viewport.width - MONTH_GAP * 3) / 2)
      : Math.max(252, Math.min(760, viewport.width - MONTH_GAP * 2));
  const monthStep = monthWidth + MONTH_GAP;
  const showTitles = monthWidth >= 600;
  const anchorRef = useRef({ month: selectedDate.slice(0, 7), offset: 0 });
  const pendingFocusRef = useRef<string | null>(null);
  const [target, setTarget] = useState(0);
  const calendar = getMonthWindow(
    extent.start,
    extent.end,
    viewport.left,
    viewport.width,
    monthStep,
  );
  const visibleMonth = shiftMonth(extent.start, Math.round(viewport.left / monthStep));
  const byDate = useMemo(() => {
    const dates = new Map<string, Release[]>();
    for (const release of releases) {
      if (!release.date) continue;
      const items = dates.get(release.date) ?? [];
      items.push(release);
      dates.set(release.date, items);
    }
    return dates;
  }, [releases]);
  const previousDate = releases.find((release) => release.date && release.date < today)?.date;
  const monthFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const weekdays = en
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["日", "月", "火", "水", "木", "金", "土"];

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const measure = () => setViewport((current) => ({ ...current, width: element.clientWidth }));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    // 前の期間の追加や画面幅の変更でも、見ていた月を保つ。
    element.scrollLeft =
      (monthsBetween(extent.start, anchorRef.current.month) + anchorRef.current.offset) * monthStep;
    setViewport({ left: element.scrollLeft, width: element.clientWidth });
  }, [target, extent.start, monthStep]);

  useLayoutEffect(() => {
    if (pendingFocusRef.current) {
      const button = scrollRef.current?.querySelector<HTMLButtonElement>(
        `[data-calendar-date="${pendingFocusRef.current}"]`,
      );
      if (button) {
        button.focus({ preventScroll: true });
        pendingFocusRef.current = null;
      }
    }
  }, [target, calendar.first, monthStep]);

  function jumpTo(date: string, focus = false) {
    if (!isExactDate(date)) return;
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
        dateInMonth(date, shiftMonth(date.slice(0, 7), event.key === "PageUp" ? -1 : 1)),
        true,
      );
    }
  }

  return (
    <section
      aria-label={en ? "Monthly release calendar" : "月別リリースカレンダー"}
      className="min-w-0"
    >
      <ReleaseViewHeader
        title={en ? "Monthly release calendar" : "月別リリースカレンダー"}
        description={
          en
            ? "Scroll through months. Select a day to pin its release details in a popup."
            : "月ごとのカレンダーを横スクロール。日付を選ぶと、ポップアップを固定してリリースの詳細を表示します。"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:flex-none">
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-lg shadow-none"
              aria-label={en ? "Previous month" : "前の月"}
              onClick={() => jumpToMonth(shiftMonth(visibleMonth, -1))}
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-lg shadow-none"
              aria-label={en ? "Next month" : "次の月"}
              onClick={() => jumpToMonth(shiftMonth(visibleMonth, 1))}
            >
              <ArrowRight aria-hidden="true" />
            </Button>
            <ReleaseDatePicker
              month={visibleMonth}
              selectedDate={selectedDate}
              today={today}
              locale={locale}
              onSelectDate={jumpTo}
              onOpen={popover.dismiss}
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <Button variant="outline" className={releaseActionClass} onClick={() => jumpTo(today)}>
              {en ? "Today" : "今日に戻る"}
            </Button>
            {previousDate && (
              <Button
                variant="ghost"
                className={cn(releaseActionClass, "text-muted-foreground")}
                onClick={() => jumpTo(previousDate)}
              >
                <CornerUpLeft className="size-3.5" aria-hidden="true" />
                {en ? "Previous release" : "直前のリリース"}
                <span className="hidden tabular-nums sm:inline">
                  {previousDate.replaceAll("-", ".")}
                </span>
              </Button>
            )}
          </div>
        </div>
      </ReleaseViewHeader>
      <ReleaseScrollArea
        ref={scrollRef}
        role="region"
        aria-label={en ? "Scrollable release calendar" : "横スクロールカレンダー"}
        tabIndex={0}
        onScroll={(event) => {
          const element = event.currentTarget;
          const position = element.scrollLeft / monthStep;
          anchorRef.current = {
            month: shiftMonth(extent.start, Math.floor(position)),
            offset: position % 1,
          };
          setViewport({ left: element.scrollLeft, width: element.clientWidth });
          if (element.scrollLeft < monthStep * 2) {
            setExtent((current) => ({ ...current, start: shiftMonth(current.start, -12) }));
          } else if (
            element.scrollWidth - element.scrollLeft - element.clientWidth <
            monthStep * 2
          ) {
            setExtent((current) => ({ ...current, end: shiftMonth(current.end, 12) }));
          }
        }}
        className="overflow-x-auto overscroll-x-contain bg-muted/20 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        style={{ scrollPaddingInline: MONTH_GAP }}
      >
        <div
          className="flex items-stretch gap-4 py-4"
          style={{
            width: calendar.total * monthStep + MONTH_GAP,
            paddingLeft: calendar.first * monthStep + MONTH_GAP,
          }}
        >
          {calendar.months.map((month) => {
            const days = getMonthDays(month);
            const count = days.reduce(
              (sum, date) => sum + (date ? (byDate.get(date)?.length ?? 0) : 0),
              0,
            );
            const current = month === today.slice(0, 7);
            const label = monthFormatter.format(dateTimestamp(`${month}-01`));
            return (
              <section
                key={month}
                data-calendar-month={month}
                aria-label={label}
                className="shrink-0 overflow-hidden rounded-xl border bg-background"
                style={{ width: monthWidth }}
              >
                <div className="flex h-16 items-center justify-between gap-2 border-b px-3 sm:px-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold tabular-nums">{label}</h3>
                    {current && (
                      <span className="rounded-md bg-teal-50 px-1.5 py-1 text-[10px] font-medium text-teal-800 dark:bg-teal-950 dark:text-teal-200">
                        {en ? "This month" : "今月"}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {count}
                    {en ? " releases" : " 件"}
                  </span>
                </div>
                <table
                  className="w-full table-fixed border-collapse"
                  aria-label={en ? `${label} calendar` : `${label}のカレンダー`}
                >
                  <thead>
                    <tr>
                      {weekdays.map((day, weekday) => (
                        <th
                          key={day}
                          scope="col"
                          className={cn(
                            "h-8 border-b bg-muted/20 text-center text-[11px] font-medium text-muted-foreground",
                            weekday === 0 && "text-rose-600 dark:text-rose-400",
                            weekday === 6 && "text-blue-600 dark:text-blue-400",
                          )}
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }, (_, week) => (
                      <tr key={week}>
                        {days.slice(week * 7, week * 7 + 7).map((date, weekday) => {
                          const items = date ? (byDate.get(date) ?? []) : [];
                          const isToday = date === today;
                          const selected = date === selectedDate;
                          const providers = [...new Set(items.map((item) => item.provider))];
                          const iconLimit = monthWidth < 294 || items.length > 2 ? 1 : 2;
                          const triggerProps = date
                            ? popover.getTriggerProps({
                                id: `calendar-${date}`,
                                date,
                                releases: items,
                              })
                            : {};
                          return (
                            <td
                              key={weekday}
                              className={cn(
                                "border-b border-r p-0 last:border-r-0",
                                week === 5 && "border-b-0",
                                !date && "bg-muted/20",
                              )}
                            >
                              {date ? (
                                <button
                                  {...triggerProps}
                                  type="button"
                                  data-calendar-date={date}
                                  aria-current={isToday ? "date" : undefined}
                                  aria-pressed={selected}
                                  aria-label={`${formatReleaseDate(date, locale)}: ${items.length}${en ? " releases" : " 件"}${isToday ? (en ? " · Today" : " · 今日") : ""}${items.length ? ` · ${items.map((item) => item.title).join(" / ")}` : ""}`}
                                  tabIndex={
                                    selected ||
                                    (date.endsWith("-01") && selectedDate.slice(0, 7) !== month)
                                      ? 0
                                      : -1
                                  }
                                  onClick={(event) => {
                                    onSelectDate(date);
                                    triggerProps.onClick?.(event);
                                  }}
                                  onKeyDown={(event) => {
                                    triggerProps.onKeyDown?.(event);
                                    handleDayKey(event, date);
                                  }}
                                  className={cn(
                                    "flex w-full cursor-pointer flex-col gap-1 p-1 text-left transition-colors hover:bg-muted/50 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                                    showTitles ? "h-24" : "h-16",
                                    selected &&
                                      "bg-teal-50/60 ring-2 ring-inset ring-teal-600 dark:bg-teal-950/40 dark:ring-teal-400",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium tabular-nums",
                                      isToday
                                        ? "bg-teal-800 font-semibold text-white dark:bg-teal-200 dark:text-teal-950"
                                        : weekday === 0
                                          ? "text-rose-600 dark:text-rose-400"
                                          : weekday === 6
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-foreground",
                                    )}
                                  >
                                    {Number(date.slice(-2))}
                                  </span>
                                  {showTitles ? (
                                    <span className="w-full space-y-0.5">
                                      {items.slice(0, 2).map((item) => (
                                        <span
                                          key={item.id}
                                          className={cn(
                                            "flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-[10px]",
                                            providerStyles[item.provider].badge,
                                          )}
                                        >
                                          <ProviderIcon
                                            provider={item.provider}
                                            className="size-4"
                                            plain
                                          />
                                          <span className="truncate">{item.title}</span>
                                        </span>
                                      ))}
                                      {items.length > 2 && (
                                        <span className="block px-1 text-[9px] text-muted-foreground">
                                          +{items.length - 2}
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="flex w-full items-center gap-0.5">
                                      {providers.slice(0, iconLimit).map((provider) => (
                                        <ProviderIcon
                                          key={provider}
                                          provider={provider}
                                          className="size-4 rounded [&_svg]:size-3"
                                        />
                                      ))}
                                      {items.length > Math.min(providers.length, iconLimit) && (
                                        <span className="text-[9px] tabular-nums text-muted-foreground">
                                          {items.length}
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </button>
                              ) : (
                                <span
                                  className={cn("block", showTitles ? "h-24" : "h-16")}
                                  aria-hidden="true"
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            );
          })}
        </div>
      </ReleaseScrollArea>
      <div className="flex items-center justify-between gap-2 border-t px-4 py-3 text-[10px] text-muted-foreground sm:px-6 sm:text-[11px]">
        <span className="shrink-0 whitespace-nowrap">← {en ? "Past" : "過去"}</span>
        <span>{en ? "Logos mark release days" : "ロゴのある日がリリース日"}</span>
        <span className="shrink-0 whitespace-nowrap">{en ? "Future" : "未来"} →</span>
      </div>
    </section>
  );
}
