import { useMemo } from "react";
import { ArrowLeft, ArrowRight, CornerUpLeft } from "lucide-react";
import type { Locale } from "@/shared/lib/routing";
import { Button } from "@/shared/ui/button";
import { shiftMonth } from "../model/release-calendar";
import type { Release } from "../model/release-calendar";
import type { ReleaseTimelineRange } from "../model/release-timeline";
import { ReleaseCalendarMonth } from "./release-calendar-month";
import { ReleaseDatePicker } from "./release-date-picker";
import type { ReleasePopoverControls } from "./release-popover";
import { ReleaseScrollArea, ReleaseViewHeader } from "./release-view-layout";
import {
  CALENDAR_MONTH_GAP,
  useReleaseCalendarNavigation,
} from "./use-release-calendar-navigation";

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
  const {
    scrollRef,
    monthWidth,
    monthStep,
    calendar,
    visibleMonth,
    jumpTo,
    jumpToMonth,
    handleDayKey,
    handleScroll,
  } = useReleaseCalendarNavigation({
    range,
    today,
    selectedDate,
    onSelectDate,
  });
  const byDate = useMemo(() => {
    const dates = new Map<string, Release[]>();
    for (const release of releases) {
      if (!release.date) {
        continue;
      }
      const items = dates.get(release.date) ?? [];
      items.push(release);
      dates.set(release.date, items);
    }
    return dates;
  }, [releases]);
  const previousDate = releases.find(
    (release) => release.date !== null && release.date < today
  )?.date;
  return (
    <section
      aria-label={en ? "Monthly release calendar" : "月別リリースカレンダー"}
      className="min-w-0"
    >
      <ReleaseViewHeader
        title={en ? "Monthly release calendar" : "月別リリースカレンダー"}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:flex-none">
            <Button
              variant="flat"
              size="icon-lg"
              aria-label={en ? "Previous month" : "前の月"}
              onClick={() => jumpToMonth(shiftMonth(visibleMonth, -1))}
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
            <Button
              variant="flat"
              size="icon-lg"
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
              onOpen={() => popover.dismiss()}
            />
          </div>
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <Button variant="flat" size="xl" onClick={() => jumpTo(today)}>
              {en ? "Today" : "今日に戻る"}
            </Button>
            {previousDate && (
              <Button
                variant="subtle"
                size="xl"
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
        aria-label={
          en ? "Scrollable release calendar" : "横スクロールカレンダー"
        }
        tabIndex={0}
        onScroll={handleScroll}
        className="scroll-px-(--strip-gap) overflow-x-auto overscroll-x-contain bg-muted/20 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        style={{
          "--strip-gap": `${CALENDAR_MONTH_GAP}px`,
        }}
      >
        <div
          className="flex w-(--strip-w) items-stretch gap-4 py-4 pl-(--strip-pad)"
          style={{
            "--strip-w": `${calendar.total * monthStep + CALENDAR_MONTH_GAP}px`,
            "--strip-pad": `${calendar.first * monthStep + CALENDAR_MONTH_GAP}px`,
          }}
        >
          {calendar.months.map((month) => (
            <ReleaseCalendarMonth
              key={month}
              month={month}
              monthWidth={monthWidth}
              byDate={byDate}
              today={today}
              selectedDate={selectedDate}
              onSelectDate={onSelectDate}
              onDayKeyDown={handleDayKey}
              locale={locale}
              popover={popover}
            />
          ))}
        </div>
      </ReleaseScrollArea>
      <div className="flex items-center justify-between gap-2 border-t px-4 py-3 text-mini text-muted-foreground sm:px-6 sm:text-label">
        <span className="shrink-0 whitespace-nowrap">
          ← {en ? "Past" : "過去"}
        </span>
        <span>
          {en ? "Logos mark release days" : "ロゴのある日がリリース日"}
        </span>
        <span className="shrink-0 whitespace-nowrap">
          {en ? "Future" : "未来"} →
        </span>
      </div>
    </section>
  );
}
