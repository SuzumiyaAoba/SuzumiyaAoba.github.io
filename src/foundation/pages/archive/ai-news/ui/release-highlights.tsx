import { ArrowUpRight, Activity, Layers3, Check } from "lucide-react";
import type { Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";
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

export function ModelFilters({
  options,
  selected,
  onToggle,
  locale,
}: {
  options: ReleaseModelOption[];
  selected: readonly string[];
  onToggle: (model: string) => void;
  locale: Locale;
}) {
  const en = locale === "en";
  if (options.length === 0) {
    return null;
  }
  return (
    <fieldset
      aria-label={en ? "Filter by model" : "モデルで絞り込み"}
      className="grid min-w-0 grid-flow-col grid-rows-2 justify-start gap-1.5 overflow-x-auto pb-2"
    >
      {options.map(({ name, provider, count }) => {
        const active = selected.includes(name);
        return (
          <button
            key={name}
            type="button"
            aria-pressed={active}
            aria-label={`${name} · ${providerLabel(provider, locale)}`}
            onClick={() => onToggle(name)}
            className={cn(
              "flex h-8 min-w-0 items-center gap-1.5 rounded-full border px-2.5 text-xs whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              active
                ? "border-ai-accent bg-ai-accent-soft font-medium text-ai-accent-ink"
                : "border-transparent bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                providerStyles[provider].dot
              )}
              aria-hidden="true"
            />
            {name}
            <span className="text-mini tabular-nums opacity-70">{count}</span>
          </button>
        );
      })}
    </fieldset>
  );
}
