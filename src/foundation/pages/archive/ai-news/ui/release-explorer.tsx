"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";
import {
  CalendarDays,
  GitCommitHorizontal,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  buildModelOptions,
  buildReleases,
  buildTitleOptions,
  filterReleases,
  sameSelection,
  toggleSelection,
} from "../model/release-calendar";
import type {
  ReleaseFilters,
  RenderedRelease,
} from "../model/release-calendar";
import { getReleaseTimelineRange } from "../model/release-timeline";
import { useCurrentDate } from "../model/use-current-date";
import { ReleaseCalendarStrip } from "./release-calendar-strip";
import { ReleaseTimeline } from "./release-timeline";
import { ReleaseList } from "./release-list";
import {
  ModelFilters,
  ProviderFilters,
  ReleaseHighlights,
} from "./release-highlights";
import { releaseSelectClass } from "./release-view-layout";
import { useReleasePopover } from "./release-popover";

const INITIAL_FILTERS: ReleaseFilters = {
  query: "",
  providers: [],
  models: [],
  titles: [],
  kind: "",
};

type ReleaseSelection = {
  providers: string[];
  models: string[];
  titles: string[];
};

const selectionParser = parseAsArrayOf(parseAsString)
  .withDefault([])
  .withOptions({ history: "replace" });

// モデル名はカンマを含むことがあるため、区切り文字を "|" にする。
const titleParser = parseAsArrayOf(parseAsString, "|")
  .withDefault([])
  .withOptions({ history: "replace" });

/** クエリパラメータと選択状態を双方向に同期する。描画は行わない。 */
function ReleaseSelectionUrlSync({
  providers,
  models,
  titles,
  validProviders,
  validModels,
  validTitles,
  onApply,
}: {
  providers: string[];
  models: string[];
  titles: string[];
  validProviders: ReadonlySet<string>;
  validModels: ReadonlySet<string>;
  validTitles: ReadonlySet<string>;
  onApply: (next: ReleaseSelection) => void;
}) {
  const [params, setParams] = useQueryStates({
    providers: selectionParser,
    models: selectionParser,
    titles: titleParser,
  });
  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;
  const pendingApply = useRef<ReleaseSelection | null>(null);

  // URL側の変化を選択状態へ適用する。未知の値はここで落とす。
  useEffect(() => {
    const next: ReleaseSelection = {
      providers: [
        ...new Set(
          params.providers.filter((provider) => validProviders.has(provider))
        ),
      ],
      models: [
        ...new Set(params.models.filter((model) => validModels.has(model))),
      ],
      titles: [
        ...new Set(params.titles.filter((title) => validTitles.has(title))),
      ],
    };
    pendingApply.current = next;
    onApplyRef.current(next);
  }, [
    params.providers,
    params.models,
    params.titles,
    validProviders,
    validModels,
    validTitles,
  ]);

  // 選択状態をURLへ書き戻す。適用中は状態側が追いつくまで待つ。
  useEffect(() => {
    const pending = pendingApply.current;
    if (pending) {
      if (
        !sameSelection(pending.providers, providers) ||
        !sameSelection(pending.models, models) ||
        !sameSelection(pending.titles, titles)
      ) {
        return;
      }
      pendingApply.current = null;
    }
    if (
      !sameSelection(params.providers, providers) ||
      !sameSelection(params.models, models) ||
      !sameSelection(params.titles, titles)
    ) {
      void setParams({ providers, models, titles });
    }
  }, [providers, models, titles, params, setParams]);

  return null;
}

export function ReleaseExplorer({
  entries,
  locale,
  today: referenceDate,
}: {
  entries: RenderedRelease[];
  locale: Locale;
  today?: string;
}) {
  const en = locale === "en";
  const id = useId();
  const popover = useReleasePopover(locale);
  const currentDate = useCurrentDate();
  const today = referenceDate ?? currentDate;
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [view, setView] = useState<"calendar" | "intervals" | "list">(
    "intervals"
  );
  const [timelineDate, setTimelineDate] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<string | null>(null);
  const releases = useMemo(() => buildReleases(entries), [entries]);
  const timelineRange = useMemo(
    () => getReleaseTimelineRange(releases),
    [releases]
  );
  const filtered = useMemo(
    () => filterReleases(releases, filters),
    [releases, filters]
  );
  const dated = filtered.filter((item) => item.date !== null);
  const latestDate = dated[0]?.date;
  const selectedDate =
    view === "calendar"
      ? (calendarDate ?? today)
      : (timelineDate ?? latestDate ?? today);
  const validProviders = useMemo(
    () => new Set(releases.map((release) => release.provider)),
    [releases]
  );
  const validModels = useMemo(
    () => new Set(releases.flatMap((release) => release.series)),
    [releases]
  );
  const validTitles = useMemo(
    () => new Set(releases.map((release) => release.title)),
    [releases]
  );
  const modelOptions = useMemo(() => buildModelOptions(releases), [releases]);
  const titleOptions = useMemo(() => buildTitleOptions(releases), [releases]);
  const applySelection = useCallback((next: ReleaseSelection) => {
    setFilters((previous) =>
      sameSelection(previous.providers, next.providers) &&
      sameSelection(previous.models, next.models) &&
      sameSelection(previous.titles, next.titles)
        ? previous
        : { ...previous, ...next }
    );
  }, []);
  const hasFilters =
    Boolean(filters.query) ||
    Boolean(filters.kind) ||
    filters.providers.length > 0 ||
    filters.models.length > 0 ||
    filters.titles.length > 0;
  const kindOptions = [
    ["", en ? "All types" : "すべての種類"],
    ["llm", "LLM"],
    ["image", en ? "Image" : "画像モデル"],
    ["audio", en ? "Audio" : "音声モデル"],
    ["agent", en ? "Agent" : "エージェント"],
    ["other", en ? "Other" : "その他"],
  ];

  function updateFilters(next: Partial<ReleaseFilters>) {
    popover.dismiss();
    setFilters((previous) => ({ ...previous, ...next }));
    setTimelineDate(null);
  }

  if (releases.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
        {en ? "No release data yet." : "リリースデータがありません。"}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <ReleaseSelectionUrlSync
          providers={filters.providers}
          models={filters.models}
          titles={filters.titles}
          validProviders={validProviders}
          validModels={validModels}
          validTitles={validTitles}
          onApply={applySelection}
        />
      </Suspense>
      <div
        className={cn(
          "rounded-2xl border bg-background",
          (view === "list" || filtered.length === 0) && "overflow-hidden"
        )}
      >
        <div data-pagefind-ignore className="overflow-hidden rounded-t-2xl">
          <ReleaseHighlights
            releases={releases}
            today={today}
            locale={locale}
            onSelectDate={(date, anchor) => {
              setFilters(INITIAL_FILTERS);
              setTimelineDate(date);
              setView("intervals");
              popover.showDetails(
                {
                  id: "latest-release",
                  date,
                  releases: releases.filter((release) => release.date === date),
                },
                anchor,
                true
              );
            }}
          />
          <div className="space-y-2 px-4 pt-4 sm:px-6">
            <ProviderFilters
              releases={releases}
              selected={filters.providers}
              allSelected={
                filters.providers.length === 0 && filters.models.length === 0
              }
              onToggle={(provider) =>
                updateFilters({
                  providers: toggleSelection(filters.providers, provider),
                })
              }
              onSelectAll={() =>
                updateFilters({ providers: [], models: [], titles: [] })
              }
              locale={locale}
            />
            <ModelFilters
              seriesOptions={modelOptions}
              titleOptions={titleOptions}
              selectedSeries={filters.models}
              selectedTitles={filters.titles}
              onToggleSeries={(model) =>
                updateFilters({
                  models: toggleSelection(filters.models, model),
                })
              }
              onToggleTitle={(title) =>
                updateFilters({
                  titles: toggleSelection(filters.titles, title),
                })
              }
              locale={locale}
            />
          </div>
          <div className="border-b">
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:px-6">
              <search className="relative col-span-2 sm:col-span-1">
                <label htmlFor={`${id}-search`} className="sr-only">
                  {en ? "Search models" : "モデルを検索"}
                </label>
                <Search
                  className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id={`${id}-search`}
                  type="search"
                  variant="icon"
                  value={filters.query}
                  onChange={(event) =>
                    updateFilters({ query: event.target.value })
                  }
                  placeholder={
                    en
                      ? "Find a model, series, or provider…"
                      : "モデル名・系列で検索…"
                  }
                />
              </search>
              <select
                aria-label={en ? "Release type" : "リリースの種類"}
                className={releaseSelectClass}
                value={filters.kind}
                onChange={(event) =>
                  updateFilters({ kind: event.target.value })
                }
              >
                {kindOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 sm:px-6">
              <fieldset
                aria-label={en ? "Display mode" : "表示形式"}
                className="flex max-w-full min-w-0 gap-1 rounded-lg bg-muted/50 p-1"
              >
                {(
                  [
                    [
                      "intervals",
                      en ? "Timeline" : "時間軸",
                      en ? "All dates" : "全期間の比較",
                      GitCommitHorizontal,
                    ],
                    [
                      "calendar",
                      en ? "Calendar" : "カレンダー",
                      en ? "Calendar" : "カレンダー",
                      CalendarDays,
                    ],
                    ["list", en ? "List" : "一覧", en ? "List" : "一覧", List],
                  ] as const
                ).map(([value, label, ariaLabel, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    aria-label={ariaLabel}
                    aria-pressed={view === value}
                    onClick={() => {
                      popover.dismiss();
                      setView(value);
                    }}
                    className={cn(
                      "relative flex h-11 cursor-pointer items-center gap-1 rounded-md px-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring sm:gap-1.5 sm:px-4 sm:text-sm",
                      view === value
                        ? "bg-background font-semibold text-ai-accent-ink shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </fieldset>
              <div className="flex min-h-10 items-center gap-3">
                <output className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                  <SlidersHorizontal
                    className="hidden size-3 sm:block"
                    aria-hidden="true"
                  />
                  <span className="sm:hidden">
                    {filtered.length}/{releases.length}
                  </span>
                  <span className="hidden sm:inline">
                    {en
                      ? `${filtered.length} of ${releases.length} releases`
                      : `${releases.length} 件中 ${filtered.length} 件`}
                  </span>
                </output>
                {hasFilters && (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-11"
                    onClick={() => updateFilters(INITIAL_FILTERS)}
                    aria-label={en ? "Clear filters" : "絞り込みを解除"}
                  >
                    <X className="size-3" aria-hidden="true" />
                    {en ? "Clear" : "解除"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="space-y-2 p-12 text-center">
            <Search
              className="mx-auto mb-4 size-6 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="font-medium">
              {en
                ? "No matching releases."
                : "条件に一致するリリースがありません。"}
            </p>
            <p className="text-sm text-muted-foreground">
              {en
                ? "Try another model name or clear the filters."
                : "別のモデル名で検索するか、絞り込みを解除してください。"}
            </p>
          </div>
        ) : view === "list" ? (
          <ReleaseList releases={filtered} locale={locale} />
        ) : (
          <div>
            {view === "calendar"
              ? today && (
                  <ReleaseCalendarStrip
                    releases={filtered}
                    range={timelineRange}
                    today={today}
                    selectedDate={selectedDate}
                    onSelectDate={setCalendarDate}
                    locale={locale}
                    popover={popover}
                  />
                )
              : dated.length > 0 &&
                timelineRange && (
                  <section
                    className="min-w-0"
                    aria-label={
                      en ? "All release intervals" : "全期間のリリース比較"
                    }
                  >
                    <ReleaseTimeline
                      locale={locale}
                      range={timelineRange}
                      releases={filtered}
                      selectedDate={selectedDate}
                      onSelectDate={setTimelineDate}
                      today={today}
                      popover={popover}
                    />
                  </section>
                )}
            {filtered.length > dated.length && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-xs text-muted-foreground sm:px-6">
                <p>
                  {en
                    ? `${filtered.length - dated.length} entries have no exact date and are shown in the list.`
                    : `日付が未詳の ${filtered.length - dated.length} 件は、一覧で確認できます。`}
                </p>
                <Button
                  variant="flat"
                  size="xs"
                  className="h-9"
                  onClick={() => {
                    popover.dismiss();
                    setView("list");
                  }}
                >
                  {en ? "View list" : "一覧で見る"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="px-1 text-label leading-6 text-muted-foreground">
        {en
          ? "Intervals compare recorded dates within the same series, including previews, limited access, and general availability. One announcement counts as one entry. This is a curated history, not an exhaustive release log."
          : "間隔は、同じ系列の記録済みリリース日を比較した日数です。プレビュー・限定提供・一般提供を含み、複数モデルの同時発表は1件として数えています。すべてのリリースを網羅した記録ではありません。"}
      </p>
      {popover.content}
    </div>
  );
}
