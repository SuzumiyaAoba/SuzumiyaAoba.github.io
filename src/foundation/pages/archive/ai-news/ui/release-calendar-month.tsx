import { useMemo } from "react";
import type { KeyboardEvent } from "react";
import type { Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";
import { dateTimestamp, formatReleaseDate } from "../model/release-calendar";
import type { Release } from "../model/release-calendar";
import { getMonthDays } from "../model/release-months";
import { ProviderIcon, providerStyles } from "./provider-identity";
import type { ReleasePopoverControls } from "./release-popover";

export function ReleaseCalendarMonth({
  month,
  monthWidth,
  byDate,
  today,
  selectedDate,
  onSelectDate,
  onDayKeyDown,
  locale,
  popover,
}: {
  month: string;
  monthWidth: number;
  byDate: ReadonlyMap<string, Release[]>;
  today: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onDayKeyDown: (event: KeyboardEvent<HTMLButtonElement>, date: string) => void;
  locale: Locale;
  popover: ReleasePopoverControls;
}) {
  const en = locale === "en";
  const showTitles = monthWidth >= 600;
  const days = getMonthDays(month);
  const count = days.reduce(
    (sum, date) => sum + (date ? (byDate.get(date)?.length ?? 0) : 0),
    0
  );
  const current = month === today.slice(0, 7);
  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        timeZone: "UTC",
      }),
    [locale]
  );
  const label = monthFormatter.format(dateTimestamp(`${month}-01`));
  const weekdays = en
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <section
      data-calendar-month={month}
      aria-label={label}
      className="w-(--month-w) shrink-0 overflow-hidden rounded-xl border bg-background"
      style={{ "--month-w": `${monthWidth}px` }}
    >
      <div className="flex h-16 items-center justify-between gap-2 border-b px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold tabular-nums">{label}</h3>
          {current && (
            <span className="rounded-md bg-ai-accent-soft px-1.5 py-1 text-mini font-medium text-ai-accent-ink">
              {en ? "This month" : "今月"}
            </span>
          )}
        </div>
        <span className="text-label text-muted-foreground tabular-nums">
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
                  "h-8 border-b bg-muted/20 text-center text-label font-medium text-muted-foreground",
                  weekday === 0 && "text-sunday",
                  weekday === 6 && "text-info"
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
              {[0, 1, 2, 3, 4, 5, 6].map((weekday) => {
                const date = days[week * 7 + weekday];
                const items = date ? (byDate.get(date) ?? []) : [];
                const isToday = date === today;
                const selected = date === selectedDate;
                const providers = [
                  ...new Set(items.map((item) => item.provider)),
                ];
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
                      "border-r border-b p-0 last:border-r-0",
                      week === 5 && "border-b-0",
                      !date && "bg-muted/20"
                    )}
                  >
                    {date ? (
                      <button
                        {...triggerProps}
                        type="button"
                        data-calendar-date={date}
                        aria-current={isToday ? "date" : undefined}
                        aria-pressed={selected}
                        aria-label={`${formatReleaseDate(date, locale)}: ${items.length}${en ? " releases" : " 件"}${isToday ? (en ? " · Today" : " · 今日") : ""}${items.length > 0 ? ` · ${items.map((item) => item.title).join(" / ")}` : ""}`}
                        tabIndex={
                          selected ||
                          (date.endsWith("-01") &&
                            selectedDate.slice(0, 7) !== month)
                            ? 0
                            : -1
                        }
                        onClick={(event) => {
                          onSelectDate(date);
                          triggerProps.onClick?.(event);
                        }}
                        onKeyDown={(event) => {
                          triggerProps.onKeyDown?.(event);
                          onDayKeyDown(event, date);
                        }}
                        className={cn(
                          "flex w-full cursor-pointer flex-col gap-1 p-1 text-left transition-colors hover:bg-muted/50 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                          showTitles ? "h-24" : "h-16",
                          selected &&
                            "bg-ai-accent-soft ring-2 ring-ai-accent ring-inset"
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full text-label font-medium tabular-nums",
                            isToday
                              ? "bg-ai-accent-ink font-semibold text-ai-accent-on-solid"
                              : weekday === 0
                                ? "text-sunday"
                                : weekday === 6
                                  ? "text-info"
                                  : "text-foreground"
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
                                  "flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-mini",
                                  providerStyles[item.provider].badge
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
                              <span className="block px-1 text-micro text-muted-foreground">
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
                            {items.length >
                              Math.min(providers.length, iconLimit) && (
                              <span className="text-micro text-muted-foreground tabular-nums">
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
}
