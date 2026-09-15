import { useId } from "react";
import { ArrowRight, ChevronDown, Clock3 } from "lucide-react";
import type { Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";
import { dateTimestamp, formatReleaseDate } from "../model/release-calendar";
import type { Release } from "../model/release-calendar";
import {
  ProviderIcon,
  providerStyles,
  providerLabel,
  kindLabel,
} from "./provider-identity";

export function ReleaseCard({
  release,
  locale,
  compact = false,
}: {
  release: Release;
  locale: Locale;
  compact?: boolean;
}) {
  const titleId = useId();
  const en = locale === "en";
  const style = providerStyles[release.provider];
  const dateLabel = release.date
    ? formatReleaseDate(release.date, locale)
    : `${release.entry.date || release.entry.year} · ${en ? "Exact date unknown" : "日付未詳"}`;
  const [primaryInterval] = release.intervals;
  const noIntervalLabel =
    release.date && release.series.length > 0
      ? en
        ? "First recorded release in this series"
        : "この系列で最初に記録されたリリース"
      : en
        ? "No dated predecessor recorded"
        : "比較できる前回の記録なし";
  const description = (
    <div className="prose max-w-none text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_p]:my-2 [&_p]:text-sm [&_p]:leading-7">
      {release.summary}
    </div>
  );
  const intervals = (
    <div className="space-y-3">
      {release.intervals.map((interval) => (
        <div
          key={interval.series}
          className={cn("rounded-xl border p-4", style.badge, style.border)}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold">{interval.series}</span>
            <span className="inline-flex items-baseline gap-1.5 text-xs">
              {en ? "After " : "前回から "}
              <strong className="text-3xl font-semibold tracking-tight tabular-nums">
                {interval.days}
              </strong>
              {en ? " days" : " 日"}
            </span>
          </div>
          <p className="mt-3 text-xs leading-5">
            {interval.previousTitles.join(" / ")}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[11px] tabular-nums opacity-75">
            <time dateTime={interval.previousDate}>
              {interval.previousDate.replaceAll("-", ".")}
            </time>
            <span
              className="h-px flex-1 bg-current opacity-25"
              aria-hidden="true"
            />
            <ArrowRight className="size-3" aria-hidden="true" />
            <time dateTime={release.date ?? undefined}>
              {release.date?.replaceAll("-", ".")}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
  const tags =
    (release.entry.tags?.length ?? 0) > 0 ? (
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        {(release.entry.tags ?? []).map((tag) => (
          <span key={tag}>#{tag}</span>
        ))}
      </div>
    ) : null;

  if (compact) {
    return (
      <article
        aria-labelledby={titleId}
        className="group px-4 py-5 transition-colors hover:bg-muted/25 sm:px-6"
      >
        <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-x-3 gap-y-3 sm:grid-cols-[4.5rem_2.75rem_minmax(0,1fr)_auto] sm:gap-x-5">
          <div className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground sm:col-span-1 sm:flex-col sm:items-start sm:gap-0">
            {release.date ? (
              <>
                <time
                  dateTime={release.date}
                  className="text-lg font-semibold whitespace-nowrap text-foreground tabular-nums sm:text-3xl"
                >
                  <span className="sm:hidden">{release.date.slice(5, 7)}.</span>
                  {release.date.slice(-2)}
                </time>
                <span className="sm:mt-1">
                  {new Intl.DateTimeFormat(locale, {
                    weekday: "short",
                    timeZone: "UTC",
                  }).format(dateTimestamp(release.date))}
                </span>
              </>
            ) : (
              <span>{dateLabel}</span>
            )}
          </div>
          <ProviderIcon
            provider={release.provider}
            className="size-11 rounded-xl"
          />
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
              <span className={cn("font-semibold", style.ink)}>
                {providerLabel(release.provider, locale)}
              </span>
              <span aria-hidden="true">/</span>
              <span>{kindLabel(release.kind, locale)}</span>
            </div>
            <h3
              id={titleId}
              className="text-base leading-6 font-semibold tracking-tight sm:text-lg"
            >
              {release.title}
            </h3>
            <p className="text-xs leading-5 text-muted-foreground">
              {release.series.join(" · ")}
            </p>
          </div>
          <div className="col-start-2 sm:col-start-auto sm:pt-1 sm:text-right">
            {primaryInterval ? (
              <div
                className={cn(
                  "inline-flex items-baseline gap-1.5 rounded-lg px-3 py-1.5 text-[11px]",
                  style.badge
                )}
              >
                {en ? "After " : "前回から "}
                <strong className="text-xl font-semibold tabular-nums">
                  {primaryInterval.days}
                </strong>
                {en ? " days" : " 日"}
                {release.intervals.length > 1 && (
                  <span className="ml-1">+{release.intervals.length - 1}</span>
                )}
              </div>
            ) : (
              <span className="rounded-lg bg-muted px-3 py-2 text-[11px] text-muted-foreground">
                {release.date && release.series.length > 0
                  ? en
                    ? "First recorded"
                    : "系列の初回記録"
                  : en
                    ? "No predecessor"
                    : "比較元なし"}
              </span>
            )}
          </div>
        </div>
        <details className="mt-3 pl-14 sm:pl-[8.5rem]">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
            {en ? "Release details" : "リリースの詳細"}
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </summary>
          <div className="mt-3 max-w-3xl space-y-4 border-l-2 border-border pl-4">
            {description}
            {release.intervals.length > 0 && intervals}
            {tags}
          </div>
        </details>
      </article>
    );
  }

  return (
    <article
      aria-labelledby={titleId}
      className="min-w-0 overflow-hidden rounded-xl border bg-background"
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ProviderIcon
              provider={release.provider}
              className="size-11 rounded-xl"
            />
            <div>
              <p className="text-sm font-semibold">
                {providerLabel(release.provider, locale)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {kindLabel(release.kind, locale)}
              </p>
            </div>
          </div>
          <span className="text-right text-[11px] text-muted-foreground tabular-nums">
            {release.date ? (
              <time dateTime={release.date}>
                {release.date.replaceAll("-", ".")}
              </time>
            ) : (
              dateLabel
            )}
          </span>
        </div>
        <h3
          id={titleId}
          className="text-xl leading-8 font-semibold tracking-tight"
        >
          {release.title}
        </h3>
        {release.intervals.length > 0 ? (
          intervals
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            <Clock3 className="size-4" aria-hidden="true" />
            {noIntervalLabel}
          </div>
        )}
        {description}
        {tags}
      </div>
    </article>
  );
}
