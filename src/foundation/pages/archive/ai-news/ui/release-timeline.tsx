import { Fragment, useId } from "react";
import { ArrowLeft, ArrowRight, ZoomIn, ZoomOut } from "lucide-react";
import type { Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { dateTimestamp, daysBetween } from "../model/release-calendar";
import type { Release } from "../model/release-calendar";
import { timelinePosition } from "../model/release-timeline";
import type { ReleaseTimelineRange } from "../model/release-timeline";
import { ProviderIcon, providerLabel, providerStyles } from "./provider-identity";
import { ReleasePoint } from "./release-point";
import type { ReleasePopoverControls } from "./release-popover";
import {
  ReleaseScrollArea,
  ReleaseViewHeader,
  releaseActionClass,
  releaseSelectClass,
} from "./release-view-layout";
import {
  AXIS_PADDING,
  SERIES_WIDTH,
  useReleaseTimelineLayout,
} from "./use-release-timeline-layout";

type ReleaseTimelineProps = {
  locale: Locale;
  range: ReleaseTimelineRange;
  releases: Release[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  today: string;
  popover: ReleasePopoverControls;
};

export function ReleaseTimeline({
  locale,
  range,
  releases,
  selectedDate,
  onSelectDate,
  today,
  popover,
}: ReleaseTimelineProps) {
  const en = locale === "en";
  const descriptionId = useId();
  const {
    scrollRef,
    zoom,
    setZoom,
    showLabels,
    endPadding,
    availableWidth,
    plotWidth,
    pixelsPerDay,
    rows,
    smallerZoom,
    largerZoom,
    scrollToDate,
    scrollPage,
    handleScroll,
  } = useReleaseTimelineLayout({ range, releases, selectedDate });

  const monthStep = pixelsPerDay * 28 >= 44 ? 1 : pixelsPerDay * 90 >= 44 ? 3 : 12;
  const ticks = range.months.filter(
    (date, index) => index === 0 || (Number(date.slice(5, 7)) - 1) % monthStep === 0,
  );
  const yearTicks: { year: number; date: string }[] = [];
  for (const year of range.years) {
    const date = `${year}-01-01` < range.start ? range.start : `${year}-01-01`;
    const previous = yearTicks.at(-1);
    if (
      !previous ||
      (daysBetween(previous.date, date) * pixelsPerDay >= 64 &&
        daysBetween(date, range.end) * pixelsPerDay >= 48)
    ) {
      yearTicks.push({ year, date });
    }
  }

  if (rows.length === 0) {
    return (
      <p className="p-8 text-center text-sm text-muted-foreground">
        {en ? "No releases with a series recorded." : "比較できる系列の記録がありません。"}
      </p>
    );
  }

  return (
    <div>
      <ReleaseViewHeader
        title={en ? "Release intervals · All dates" : "全期間のリリース間隔"}
        description={
          en ? "Select a model for release details." : "モデルを選択してリリースの詳細を表示"
        }
        descriptionId={descriptionId}
        aside={
          <p className="text-[11px] leading-7 tabular-nums text-muted-foreground">
            {range.firstDate.replaceAll("-", ".")} — {range.lastDate.replaceAll("-", ".")}
          </p>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="icon"
              variant="outline"
              className="size-10 rounded-lg shadow-none"
              aria-label={en ? "Scroll to earlier releases" : "過去へスクロール"}
              onClick={() => scrollPage(-1)}
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="size-10 rounded-lg shadow-none"
              aria-label={en ? "Scroll to later releases" : "未来へスクロール"}
              onClick={() => scrollPage(1)}
            >
              <ArrowRight aria-hidden="true" />
            </Button>
            <select
              aria-label={en ? "Jump to year" : "年へ移動"}
              className={releaseSelectClass}
              value=""
              onChange={(event) => scrollToDate(`${event.target.value}-01-01`)}
            >
              <option value="" disabled>
                {en ? "Jump to year" : "年へ移動"}
              </option>
              {range.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                  {!en && "年"}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              className={releaseActionClass}
              onClick={() => {
                const date = releases.findLast((release) => release.date)?.date;
                if (date) {
                  onSelectDate(date);
                  scrollToDate(date);
                }
              }}
            >
              {en ? "Earliest" : "最初の記録"}
            </Button>
            <Button
              variant="ghost"
              className={releaseActionClass}
              onClick={() => {
                const date = releases.find((release) => release.date)?.date;
                if (date) {
                  onSelectDate(date);
                  scrollToDate(date);
                }
              }}
            >
              {en ? "Latest" : "最新の記録"}
            </Button>
          </div>
          <fieldset
            aria-label={en ? "Timeline zoom" : "時間軸の表示倍率"}
            className="min-w-0 flex items-center gap-1.5"
          >
            <Button
              size="icon"
              variant="outline"
              className="size-10 rounded-lg shadow-none"
              aria-label={en ? "Zoom out" : "縮小"}
              disabled={smallerZoom === undefined || plotWidth <= availableWidth}
              onClick={() => {
                if (smallerZoom !== undefined) {
                  setZoom(smallerZoom);
                }
              }}
            >
              <ZoomOut aria-hidden="true" />
            </Button>
            <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground">
              {Math.round((pixelsPerDay / 3) * 100)}%
            </span>
            <Button
              size="icon"
              variant="outline"
              className="size-10 rounded-lg shadow-none"
              aria-label={en ? "Zoom in" : "拡大"}
              disabled={largerZoom === undefined}
              onClick={() => {
                if (largerZoom !== undefined) {
                  setZoom(largerZoom);
                }
              }}
            >
              <ZoomIn aria-hidden="true" />
            </Button>
            <Button
              variant={zoom === "fit" ? "secondary" : "outline"}
              className={releaseActionClass}
              aria-pressed={zoom === "fit"}
              onClick={() => setZoom("fit")}
            >
              {en ? "Fit all dates" : "全期間を表示"}
            </Button>
          </fieldset>
        </div>
      </ReleaseViewHeader>
      <ReleaseScrollArea
        ref={scrollRef}
        aria-label={en ? "Release interval chart" : "リリース間隔の比較チャート"}
        aria-describedby={descriptionId}
        tabIndex={0}
        onScroll={handleScroll}
        style={{ scrollPaddingLeft: SERIES_WIDTH }}
        className="isolate max-h-[72vh] scroll-pt-16 overflow-auto overscroll-x-contain focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
      >
        <div style={{ width: SERIES_WIDTH + AXIS_PADDING + endPadding + plotWidth }}>
          <div className="sticky top-0 z-30 flex border-b bg-muted text-xs text-muted-foreground">
            <div
              style={{ width: SERIES_WIDTH }}
              className="sticky left-0 z-40 flex shrink-0 items-center border-r bg-muted px-4 py-3 font-medium text-foreground"
            >
              {en ? "Model series" : "モデル系列"}
            </div>
            <div
              className="relative h-16 flex-1"
              style={{ marginLeft: AXIS_PADDING, marginRight: endPadding }}
            >
              {yearTicks.map(({ year, date: start }, index) => {
                const end = yearTicks[index + 1]?.date ?? range.end;
                return (
                  <div
                    key={year}
                    className="absolute top-0 h-8 border-l pt-2 font-semibold text-foreground"
                    style={{
                      left: `${timelinePosition(start, range)}%`,
                      width: `${timelinePosition(end, range) - timelinePosition(start, range)}%`,
                    }}
                  >
                    <span className="sticky left-48 inline-block max-w-full truncate px-2 align-top">
                      {year}
                      {!en && "年"}
                    </span>
                  </div>
                );
              })}
              {monthStep < 12 &&
                ticks.map((date) => (
                  <span
                    key={date}
                    className="absolute top-10 pl-2"
                    style={{ left: `${timelinePosition(date, range)}%` }}
                  >
                    {en
                      ? new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(
                          dateTimestamp(date),
                        )
                      : `${Number(date.slice(5, 7))}月`}
                  </span>
                ))}
              {monthStep === 12 && (
                <div className="absolute inset-x-0 top-10 flex justify-between gap-2 whitespace-nowrap text-[10px] tabular-nums">
                  {plotWidth < 112 ? (
                    <span>{en ? "All dates" : "全期間"}</span>
                  ) : (
                    <>
                      <span>{range.start.slice(0, 7).replace("-", ".")}</span>
                      <span>{range.lastDate.slice(0, 7).replace("-", ".")}</span>
                    </>
                  )}
                </div>
              )}
              {today && today >= range.start && today < range.end && (
                <span
                  className="pointer-events-none absolute top-full z-10 -translate-x-1/2 rounded-b bg-teal-300 px-1.5 py-1 text-[9px] font-semibold text-teal-950"
                  style={{ left: `${timelinePosition(today, range)}%` }}
                >
                  {en ? "TODAY" : "今日"}
                </span>
              )}
            </div>
          </div>
          {rows.map(({ series, release, dates, points, laneCount }, index) => (
            <Fragment key={`${release.provider}-${release.kind}-${series}`}>
              {rows[index - 1]?.release.provider !== release.provider && (
                <div className="flex border-b bg-muted/40">
                  <div
                    style={{ width: SERIES_WIDTH }}
                    className="sticky left-0 z-20 flex shrink-0 items-center gap-2.5 border-r bg-background px-4 py-2.5"
                  >
                    <ProviderIcon provider={release.provider} className="size-6 rounded-md" />
                    <span className="text-xs font-semibold">
                      {providerLabel(release.provider, locale)}
                    </span>
                  </div>
                  <div className="flex items-center pl-6 text-[10px] font-medium text-muted-foreground">
                    {rows.filter((row) => row.release.provider === release.provider).length}
                    {en ? " model series" : " 系列"}
                  </div>
                </div>
              )}
              <div className="group/series flex border-b transition-colors hover:bg-muted/20">
                <div
                  style={{ width: SERIES_WIDTH }}
                  className="sticky left-0 z-20 flex shrink-0 flex-col justify-center gap-1.5 border-r bg-background px-4 py-3"
                >
                  <span className="flex items-center gap-2 text-xs font-medium">
                    <ProviderIcon provider={release.provider} className="size-6 rounded-lg" plain />
                    {series}
                  </span>
                  <span className="pl-8 text-[10px] text-muted-foreground">
                    {dates.size}
                    {en ? " release dates" : " 回のリリース"}
                  </span>
                </div>
                <div
                  className="relative flex-1"
                  style={{
                    marginLeft: AXIS_PADDING,
                    marginRight: endPadding,
                    height: 84 + (laneCount - 1) * 40,
                  }}
                >
                  {ticks.map((date) => (
                    <span
                      key={date}
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-y-0 w-px",
                        date.slice(5, 7) === "01" ? "bg-border" : "bg-border/50",
                      )}
                      style={{ left: `${timelinePosition(date, range)}%` }}
                    />
                  ))}
                  {selectedDate >= range.start && selectedDate < range.end && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 w-px bg-teal-700/30 dark:bg-teal-300/40"
                      style={{ left: `${timelinePosition(selectedDate, range)}%` }}
                    />
                  )}
                  {today && today >= range.start && today < range.end && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 border-l border-dashed border-teal-600/50"
                      style={{ left: `${timelinePosition(today, range)}%` }}
                    />
                  )}
                  {points.map(({ date, sameDay, lane }) => {
                    const [item] = sameDay;
                    if (!item) {
                      return null;
                    }
                    const interval = item.intervals.find((value) => value.series === series);
                    const end = timelinePosition(date, range);
                    const start = interval ? timelinePosition(interval.previousDate, range) : end;
                    const titles = sameDay.map((value) => value.title).join(" / ");
                    return (
                      <div key={date}>
                        {interval && (
                          <div
                            aria-hidden="true"
                            title={`${interval.previousDate} → ${date}: ${interval.days}${en ? " days" : "日"}`}
                            className="absolute top-10 h-px"
                            style={{ left: `${start}%`, width: `${end - start}%` }}
                          >
                            <span
                              className={cn(
                                "absolute inset-0 opacity-40",
                                providerStyles[item.provider].dot,
                              )}
                            />
                            {interval.days * pixelsPerDay > 56 && (
                              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border/60 bg-background/95 px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                                {interval.days}
                                {en ? "d" : "日"}
                              </span>
                            )}
                          </div>
                        )}
                        <ReleasePoint
                          date={date}
                          series={series}
                          titles={titles}
                          interval={interval}
                          provider={item.provider}
                          locale={locale}
                          position={end}
                          lane={lane}
                          selected={date === selectedDate}
                          onSelect={() => onSelectDate(date)}
                          labelled={showLabels}
                          releases={sameDay}
                          popover={popover}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </ReleaseScrollArea>
    </div>
  );
}
