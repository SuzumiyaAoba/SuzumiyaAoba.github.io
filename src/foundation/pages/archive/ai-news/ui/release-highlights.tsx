import { useState } from "react";
import {
  ArrowUpRight,
  Activity,
  Check,
  ChevronDown,
  Layers3,
  X,
} from "lucide-react";
import type { Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { PROVIDERS } from "../model/release-calendar";
import type {
  Provider,
  Release,
  ReleaseModelOption,
} from "../model/release-calendar";
import { getReleaseActivity } from "../model/release-activity";
import {
  ProviderIcon,
  providerLabel,
  providerStyles,
} from "./provider-identity";

export function ReleaseHighlights({
  releases,
  today,
  locale,
  onSelectDate,
}: {
  releases: Release[];
  today: string;
  locale: Locale;
  onSelectDate: (date: string, anchor: HTMLButtonElement) => void;
}) {
  const en = locale === "en";
  const { recent, change, latest } = getReleaseActivity(releases, today);
  return (
    <div className="grid divide-y border-b bg-muted/20 sm:grid-cols-[auto_minmax(0,1fr)] sm:divide-x sm:divide-y-0">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Activity className="size-4 text-ai-accent-ink" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">
          {en ? "Last 30 days" : "直近30日"}
        </span>
        <span className="text-sm">
          <strong className="text-xl font-semibold tabular-nums">
            {today ? recent.length : "—"}
          </strong>{" "}
          <span className="text-xs text-muted-foreground">
            {en ? "releases" : "件"}
          </span>
        </span>
        <span
          className="text-label text-muted-foreground"
          title={
            en ? "Compared with the previous 30 days" : "その前の30日との比較"
          }
        >
          {en ? "vs. prior: " : "前期比 "}
          <span className="font-medium tabular-nums">
            {today ? (change > 0 ? `+${change}` : change) : "—"}
          </span>
        </span>
      </div>
      {latest?.date ? (
        <button
          type="button"
          onClick={(event) => onSelectDate(latest.date, event.currentTarget)}
          aria-haspopup="dialog"
          aria-label={
            en ? "Explore the latest release" : "最新リリースの詳細を見る"
          }
          className="group flex min-w-0 items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-6"
        >
          <span className="shrink-0 text-label text-muted-foreground">
            {en ? "Latest" : "最新"}
          </span>
          <ProviderIcon
            provider={latest.provider}
            className="size-6 rounded-md"
          />
          <span className="min-w-0 flex-1 truncate text-xs font-semibold sm:text-sm">
            {latest.title}
          </span>
          <time
            dateTime={latest.date}
            className="shrink-0 text-mini text-muted-foreground tabular-nums sm:text-xs"
          >
            {latest.date.replaceAll("-", ".")}
          </time>
          <ArrowUpRight
            className="size-4 shrink-0 text-ai-accent-ink"
            aria-hidden="true"
          />
        </button>
      ) : (
        <p className="px-4 py-3 text-xs text-muted-foreground sm:px-6">
          {en
            ? "Explore the release history below."
            : "提供元を選んでリリースの歴史をたどれます。"}
        </p>
      )}
    </div>
  );
}

export function ProviderFilters({
  releases,
  selected,
  allSelected,
  onToggle,
  onSelectAll,
  locale,
}: {
  releases: Release[];
  selected: readonly string[];
  allSelected: boolean;
  onToggle: (provider: Provider) => void;
  onSelectAll: () => void;
  locale: Locale;
}) {
  const en = locale === "en";
  const providers = PROVIDERS.filter((provider) =>
    releases.some((release) => release.provider === provider)
  );
  return (
    <fieldset
      aria-label={en ? "Filter by provider" : "提供元で絞り込み"}
      className="grid min-w-0 auto-cols-[7rem] grid-flow-col gap-1.5 overflow-x-auto pb-2 sm:auto-cols-[9rem] sm:gap-2 lg:auto-cols-[11rem]"
    >
      <button
        type="button"
        aria-label={en ? "Show all releases" : "すべてのリリースを表示"}
        aria-pressed={allSelected}
        onClick={onSelectAll}
        className={cn(
          "relative flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg border px-1 py-2.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring lg:flex-row lg:justify-start lg:gap-2 lg:px-3",
          allSelected
            ? "border-ai-accent bg-ai-accent-soft text-ai-accent-ink"
            : "border-transparent bg-muted/30 hover:border-border hover:bg-muted/50"
        )}
      >
        <span className="flex size-6 items-center justify-center sm:size-7">
          <Layers3
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
        </span>
        <span className="min-w-0 truncate text-micro font-medium sm:text-xs">
          {en ? "All" : "すべて"}
        </span>
        <span className="ml-auto hidden shrink-0 items-center gap-1.5 text-label whitespace-nowrap text-muted-foreground tabular-nums xl:flex">
          {allSelected && <Check className="size-3" aria-hidden="true" />}
          {releases.length}
        </span>
      </button>
      {providers.map((provider) => {
        const active = selected.includes(provider);
        const count = releases.filter(
          (release) => release.provider === provider
        ).length;
        return (
          <button
            key={provider}
            type="button"
            aria-label={providerLabel(provider, locale)}
            aria-pressed={active}
            onClick={() => onToggle(provider)}
            className={cn(
              "relative flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg border px-1 py-2.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring lg:flex-row lg:justify-start lg:gap-2 lg:px-3",
              active
                ? "border-ai-accent bg-ai-accent-soft text-ai-accent-ink"
                : "border-transparent bg-muted/30 hover:border-border hover:bg-muted/50"
            )}
          >
            <ProviderIcon
              provider={provider}
              className="size-6 rounded-md sm:size-7"
            />
            <span className="min-w-0 truncate text-micro font-medium sm:text-xs">
              {providerLabel(provider, locale)}
            </span>
            <span className="ml-auto hidden shrink-0 items-center gap-1.5 text-label whitespace-nowrap text-muted-foreground tabular-nums xl:flex">
              {active && <Check className="size-3" aria-hidden="true" />}
              {count}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}

type ModelFilterLabels = {
  label: string;
  trigger: string;
  content: string;
  options: string;
  search: string;
  placeholder: string;
  empty: string;
};

/** 系列・モデル名どちらにも使う、検索付きの複数選択ポップオーバー。 */
function ModelFilterSelect({
  labels,
  options,
  selected,
  onToggle,
  locale,
}: {
  labels: ModelFilterLabels;
  options: ReleaseModelOption[];
  selected: readonly string[];
  onToggle: (name: string) => void;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const en = locale === "en";
  const normalizedQuery = query.trim().toLowerCase();
  const visibleOptions = normalizedQuery
    ? options.filter((option) =>
        `${option.name} ${option.provider}`
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : options;
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={selected.length > 0 ? "secondary" : "flat"}
          size="xl"
          aria-label={labels.trigger}
        >
          {labels.label}
          <span className="text-xs text-muted-foreground tabular-nums">
            {selected.length > 0 ? selected.length : en ? "All" : "すべて"}
          </span>
          <ChevronDown
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        variant="bare"
        aria-label={labels.content}
        className="flex w-80 max-w-[calc(100vw-24px)] flex-col overflow-hidden"
      >
        <div className="shrink-0 border-b p-2">
          <Input
            type="search"
            value={query}
            aria-label={labels.search}
            placeholder={labels.placeholder}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <fieldset
          aria-label={labels.options}
          className="max-h-80 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-1.5"
        >
          {visibleOptions.map(({ name, provider, count }) => {
            const active = selected.includes(name);
            return (
              <button
                key={name}
                type="button"
                aria-pressed={active}
                aria-label={`${name} · ${providerLabel(provider, locale)}`}
                onClick={() => onToggle(name)}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring",
                  active && "font-medium"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    providerStyles[provider].dot
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{name}</span>
                <span className="shrink-0 text-mini text-muted-foreground tabular-nums">
                  {count}
                </span>
                {active && (
                  <Check
                    className="size-3.5 shrink-0 text-ai-accent-ink"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
          {visibleOptions.length === 0 && (
            <p className="p-3 text-xs text-muted-foreground">{labels.empty}</p>
          )}
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}

/** 系列は増えてもチップで潰れないよう、検索付きの一覧へ収める。選択中は解除用チップで示す。 */
export function ModelFilters({
  seriesOptions,
  titleOptions,
  selectedSeries,
  selectedTitles,
  onToggleSeries,
  onToggleTitle,
  locale,
}: {
  seriesOptions: ReleaseModelOption[];
  titleOptions: ReleaseModelOption[];
  selectedSeries: readonly string[];
  selectedTitles: readonly string[];
  onToggleSeries: (model: string) => void;
  onToggleTitle: (title: string) => void;
  locale: Locale;
}) {
  const en = locale === "en";
  if (seriesOptions.length === 0 && titleOptions.length === 0) {
    return null;
  }
  const selected = [
    ...seriesOptions
      .filter((option) => selectedSeries.includes(option.name))
      .map((option) => ({
        option,
        kind: "series",
        removeLabel: en
          ? `Remove the ${option.name} series filter`
          : `系列 ${option.name} の絞り込みを解除`,
        onToggle: onToggleSeries,
      })),
    ...titleOptions
      .filter((option) => selectedTitles.includes(option.name))
      .map((option) => ({
        option,
        kind: "model",
        removeLabel: en
          ? `Remove the ${option.name} model filter`
          : `モデル ${option.name} の絞り込みを解除`,
        onToggle: onToggleTitle,
      })),
  ];
  return (
    <fieldset
      aria-label={en ? "Filter by model" : "モデルで絞り込み"}
      className="flex min-w-0 flex-wrap items-center gap-1.5 pb-2"
    >
      {seriesOptions.length > 0 && (
        <ModelFilterSelect
          labels={{
            label: en ? "Series" : "系列",
            trigger: en ? "Filter by model series" : "モデル系列で絞り込み",
            content: en ? "Model series options" : "モデル系列の選択肢",
            options: en ? "Model series" : "モデル系列",
            search: en ? "Filter model series" : "系列を検索",
            placeholder: en ? "Filter series…" : "系列を検索…",
            empty: en ? "No matching series." : "一致する系列がありません。",
          }}
          options={seriesOptions}
          selected={selectedSeries}
          onToggle={onToggleSeries}
          locale={locale}
        />
      )}
      {titleOptions.length > 0 && (
        <ModelFilterSelect
          labels={{
            label: en ? "Model" : "モデル",
            trigger: en ? "Filter by model name" : "モデル名で絞り込み",
            content: en ? "Model options" : "モデルの選択肢",
            options: en ? "Models" : "モデル",
            search: en ? "Filter models" : "モデル名を検索",
            placeholder: en ? "Filter models…" : "モデル名を検索…",
            empty: en ? "No matching models." : "一致するモデルがありません。",
          }}
          options={titleOptions}
          selected={selectedTitles}
          onToggle={onToggleTitle}
          locale={locale}
        />
      )}
      {selected.map(({ option, kind, removeLabel, onToggle }) => (
        <button
          key={`${kind}-${option.name}`}
          type="button"
          aria-pressed="true"
          aria-label={removeLabel}
          onClick={() => onToggle(option.name)}
          className="flex h-8 min-w-0 cursor-pointer items-center gap-1.5 rounded-full border border-ai-accent bg-ai-accent-soft px-2.5 text-xs font-medium whitespace-nowrap text-ai-accent-ink transition-colors focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              providerStyles[option.provider].dot
            )}
            aria-hidden="true"
          />
          {option.name}
          <X className="size-3" aria-hidden="true" />
        </button>
      ))}
    </fieldset>
  );
}
