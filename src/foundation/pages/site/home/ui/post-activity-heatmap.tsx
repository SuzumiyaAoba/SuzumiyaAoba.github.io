"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";
import type { BlogPost, LocalizedBlogPost } from "@/entities/blog";
import type { Locale } from "@/shared/lib/locale-path";
import { BlogPostList } from "@/entities/blog";

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeDateString(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const isoMatch = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoMatch) {
    return isoMatch[0];
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return toDateKey(parsed);
}

type PostActivityIndex = Map<string, LocalizedBlogPost[]>;

function resolvePost(variant: LocalizedBlogPost, locale: Locale) {
  return locale === "ja" ? (variant.ja ?? variant.en) : (variant.en ?? variant.ja);
}

function buildPostIndex(posts: LocalizedBlogPost[]): PostActivityIndex {
  const index = new Map<string, LocalizedBlogPost[]>();
  for (const variant of posts) {
    const reference = variant.ja ?? variant.en;
    if (!reference) continue;
    const dateKey = normalizeDateString(reference.frontmatter.date ?? "");
    if (!dateKey) continue;
    const items = index.get(dateKey) ?? [];
    items.push(variant);
    index.set(dateKey, items);
  }
  return index;
}

type HeatmapDay = {
  date: Date;
  dateKey: string;
  count: number;
  inRange: boolean;
};

type HeatmapWeek = Array<HeatmapDay | null>;

type HeatmapData = {
  weeks: HeatmapWeek[];
  maxCount: number;
  totalCount: number;
  rangeStart: Date;
  rangeEnd: Date;
  index: PostActivityIndex;
};

function buildHeatmapData(posts: LocalizedBlogPost[]): HeatmapData {
  const index = buildPostIndex(posts);
  const rangeEnd = new Date();
  rangeEnd.setHours(0, 0, 0, 0);

  const rangeStart = new Date(rangeEnd.getTime() - DAY_MS * 364);
  const gridStart = new Date(rangeStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const totalDays = Math.floor((rangeEnd.getTime() - gridStart.getTime()) / DAY_MS) + 1;
  const weeksCount = Math.ceil(totalDays / 7);
  const weeks: HeatmapWeek[] = Array.from({ length: weeksCount }, () =>
    Array.from({ length: 7 }, () => null),
  );

  let maxCount = 0;
  let totalCount = 0;

  for (let i = 0; i < totalDays; i += 1) {
    const date = new Date(gridStart.getTime() + DAY_MS * i);
    const weekIndex = Math.floor(i / 7);
    const dayIndex = date.getDay();
    const inRange = date >= rangeStart && date <= rangeEnd;
    const dateKey = toDateKey(date);
    const count = inRange ? (index.get(dateKey)?.length ?? 0) : 0;

    if (inRange) {
      totalCount += count;
      if (count > maxCount) {
        maxCount = count;
      }
    }

    const targetWeek = weeks[weekIndex];
    if (targetWeek) {
      targetWeek[dayIndex] = { date, dateKey, count, inRange };
    }
  }

  return { weeks, maxCount, totalCount, rangeStart, rangeEnd, index };
}

function getIntensity(count: number, maxCount: number): number {
  if (count <= 0) return 0;
  if (maxCount <= 1) return 4;
  return Math.min(4, Math.max(1, Math.ceil((count / maxCount) * 4)));
}

function getWeekLabel(week: HeatmapWeek, locale: Locale): string | null {
  const firstDay = week.find((day) => day?.inRange && day.date.getDate() === 1);
  if (!firstDay) return null;
  if (locale === "ja") {
    return `${firstDay.date.getMonth() + 1}月`;
  }
  return firstDay.date.toLocaleDateString("en-US", { month: "short" });
}

const LEVEL_CLASSES = [
  "bg-muted/40",
  "bg-chart-2/20",
  "bg-chart-2/40",
  "bg-chart-2/60",
  "bg-chart-2/80",
];

type PostActivityHeatmapProps = {
  posts: LocalizedBlogPost[];
  locale: Locale;
  className?: string;
};

export function PostActivityHeatmap({ posts, locale, className }: PostActivityHeatmapProps) {
  const { weeks, maxCount, totalCount, rangeStart, rangeEnd, index } = useMemo(
    () => buildHeatmapData(posts),
    [posts],
  );
  const [hoveredDateKey, setHoveredDateKey] = useState<string | null>(null);
  const [pinnedDateKey, setPinnedDateKey] = useState<string | null>(null);
  const activeDateKey = pinnedDateKey ?? hoveredDateKey;
  const hoverTimeoutRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const dateLocale = locale === "en" ? "en-US" : "ja-JP";
  const isJa = locale === "ja";

  const legendLabel = isJa ? "少ない" : "Less";
  const legendLabelMax = isJa ? "多い" : "More";
  const activePosts = activeDateKey ? index.get(activeDateKey) ?? [] : [];
  const activeDateLabel = activeDateKey
    ? new Date(activeDateKey).toLocaleDateString(dateLocale)
    : null;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const raf = window.requestAnimationFrame(() => {
      container.scrollLeft = container.scrollWidth;
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const clearHoverTimeout = () => {
    if (hoverTimeoutRef.current !== null) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const scheduleHoverClear = () => {
    if (pinnedDateKey) return;
    clearHoverTimeout();
    hoverTimeoutRef.current = window.setTimeout(() => {
      setHoveredDateKey(null);
      hoverTimeoutRef.current = null;
    }, 250);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {rangeStart.toLocaleDateString(dateLocale)} - {rangeEnd.toLocaleDateString(dateLocale)}
        </span>
        <span>
          {isJa ? "合計" : "Total"}: {totalCount}{isJa ? "件" : " posts"}
        </span>
      </div>
      <div className="overflow-x-auto" ref={scrollContainerRef}>
        <div className="inline-flex flex-col gap-2">
          <div className="inline-flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <span key={`empty-${weekIndex}-${dayIndex}`} className="size-3" />;
                  }
                  const level = day.inRange ? getIntensity(day.count, maxCount) : 0;
                  const isPinned = pinnedDateKey === day.dateKey;
                  const isHovered = hoveredDateKey === day.dateKey;
                  const items = day.inRange ? index.get(day.dateKey) ?? [] : [];
                  const titles = items
                    .map((item) => resolvePost(item, locale))
                    .filter((item): item is BlogPost => Boolean(item))
                    .map((item) => item.frontmatter.title || item.slug)
                    .join(isJa ? "、" : ", ");
                  const title = isJa
                    ? `${day.dateKey}：${day.count}件${titles ? `\n${titles}` : ""}`
                    : `${day.dateKey}: ${day.count} posts${titles ? `\n${titles}` : ""}`;

                  return (
                    <button
                      type="button"
                      key={day.dateKey}
                      title={title}
                      aria-label={title}
                      className={cn(
                        "size-3 rounded-[3px] border transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                        isPinned
                          ? "border-foreground"
                          : isHovered
                            ? "border-foreground/60"
                            : "border-border/60",
                        day.inRange ? LEVEL_CLASSES[level] : "bg-muted/20",
                        day.inRange ? "hover:scale-110" : "cursor-default",
                      )}
                      onClick={() => {
                        if (!day.inRange) return;
                        setPinnedDateKey((prev) => (prev === day.dateKey ? null : day.dateKey));
                      }}
                      onMouseEnter={() => {
                        if (!day.inRange) return;
                        clearHoverTimeout();
                        setHoveredDateKey(day.dateKey);
                      }}
                      onMouseLeave={scheduleHoverClear}
                      onFocus={() => {
                        if (!day.inRange) return;
                        clearHoverTimeout();
                        setHoveredDateKey(day.dateKey);
                      }}
                      onBlur={scheduleHoverClear}
                      disabled={!day.inRange}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="inline-flex gap-1 text-[11px] text-muted-foreground">
            {weeks.map((week, weekIndex) => (
              <span key={`label-${weekIndex}`} className="w-3 text-center">
                {getWeekLabel(week, locale) ?? ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
        <span>{legendLabel}</span>
        <div className="flex items-center gap-1">
          {LEVEL_CLASSES.map((cls, index) => (
            <span
              key={`legend-${index}`}
              className={cn("size-3 rounded-[3px] border border-border/60", cls)}
            />
          ))}
        </div>
        <span>{legendLabelMax}</span>
      </div>
      {activeDateKey ? (
        <div
          className="space-y-2"
          onMouseEnter={clearHoverTimeout}
          onMouseLeave={scheduleHoverClear}
        >
          <div className="text-xs text-muted-foreground">{activeDateLabel}</div>
          <BlogPostList
            posts={activePosts}
            locale={locale}
            emptyMessage={{
              ja: "この日の記事はありません。",
              en: "No posts on this day.",
            }}
            showThumbnail
          />
        </div>
      ) : null}
    </div>
  );
}
