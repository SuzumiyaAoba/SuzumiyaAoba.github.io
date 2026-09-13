import { useMemo, useState } from "react";
import { ArrowDownWideNarrow } from "lucide-react";
import type { Locale } from "@/shared/lib/routing";
import { dateTimestamp, type Release } from "../model/release-calendar";
import { ReleaseCard } from "./release-card";
import { ReleaseViewHeader, releaseSelectClass } from "./release-view-layout";

export function ReleaseList({ releases, locale }: { releases: Release[]; locale: Locale }) {
  const en = locale === "en";
  const [order, setOrder] = useState("newest");
  const groups = useMemo(() => {
    const sorted = [...releases].sort((a, b) => {
      if (!a.date || !b.date) return a.date ? -1 : b.date ? 1 : b.entry.year - a.entry.year;
      return (
        (order === "newest" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)) ||
        a.title.localeCompare(b.title)
      );
    });
    const months = new Map<string, Release[]>();
    for (const release of sorted) {
      const month = release.date?.slice(0, 7) ?? "undated";
      const items = months.get(month) ?? [];
      items.push(release);
      months.set(month, items);
    }
    return [...months];
  }, [releases, order]);

  return (
    <section aria-label={en ? "All recorded releases" : "全期間のリリース一覧"} className="min-w-0">
      <ReleaseViewHeader
        title={en ? "All recorded releases" : "全期間のリリース一覧"}
        aside={
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowDownWideNarrow className="size-4" aria-hidden="true" />
            <span className="sr-only">{en ? "Sort releases" : "リリースの並び順"}</span>
            <select
              className={releaseSelectClass}
              value={order}
              onChange={(event) => setOrder(event.target.value)}
            >
              <option value="newest">{en ? "Newest first" : "新しい順"}</option>
              <option value="oldest">{en ? "Oldest first" : "古い順"}</option>
            </select>
          </label>
        }
      />
      {groups.map(([month, items]) => (
        <section key={month} className="border-b last:border-b-0">
          <div className="flex items-baseline justify-between gap-4 border-b bg-muted/30 px-4 py-3 sm:px-6">
            <h3 className="text-sm font-semibold tabular-nums">
              {month === "undated"
                ? en
                  ? "Undated"
                  : "日付未詳"
                : new Intl.DateTimeFormat(locale, {
                    year: "numeric",
                    month: "long",
                    timeZone: "UTC",
                  }).format(dateTimestamp(`${month}-01`))}
            </h3>
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {items.length}
              {en ? " releases" : " 件のリリース"}
            </p>
          </div>
          <div className="min-w-0 divide-y">
            {items.map((release) => (
              <ReleaseCard key={release.id} release={release} locale={locale} compact />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
