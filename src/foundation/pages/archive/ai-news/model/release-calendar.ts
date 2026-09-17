import type { ReactElement } from "react";
import type { AiNewsEntry } from "@/shared/lib/ai-news";
import type { Locale } from "@/shared/lib/routing";

export type RenderedRelease = {
  entry: AiNewsEntry;
  title: string;
  summary: ReactElement | string;
};

export const PROVIDERS = [
  "OpenAI",
  "Anthropic",
  "Google",
  "DeepSeek",
  "Alibaba",
  "Moonshot AI",
  "Meta",
  "Mistral AI",
  "xAI",
  "Z.ai",
  "MiniMax",
  "Microsoft",
  "Cohere",
  "AI21 Labs",
  "Amazon",
  "NVIDIA",
  "IBM",
  "Ai2",
  "Hugging Face",
  "Tencent",
  "Baidu",
  "01.AI",
  "TII",
  "Databricks",
  "Preferred Networks",
  "ELYZA",
  "SB Intuitions",
  "LLM-jp",
  "Other",
] as const;
export type Provider = (typeof PROVIDERS)[number];
export type ReleaseKind = "llm" | "image" | "audio" | "agent" | "other";

export type ReleaseInterval = {
  series: string;
  previousDate: string;
  previousTitles: string[];
  days: number;
};

export type Release = RenderedRelease & {
  id: string;
  date: string | null;
  provider: Provider;
  kind: ReleaseKind;
  series: string[];
  intervals: ReleaseInterval[];
};

const DAY_MS = 86_400_000;

/** 日付のみを UTC で扱い、夏時間や閲覧者のタイムゾーンで日数が変わるのを防ぐ。 */
export function dateTimestamp(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export function isExactDate(date?: string): date is string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/u.test(date)) {
    return false;
  }
  const timestamp = dateTimestamp(date);
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === date
  );
}

export function daysBetween(from: string, to: string): number {
  return Math.round((dateTimestamp(to) - dateTimestamp(from)) / DAY_MS);
}

export function formatReleaseDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(dateTimestamp(date));
}

export function shiftMonth(month: string, offset: number): string {
  const date = new Date(dateTimestamp(`${month}-01`));
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

function resolveProvider(tags: string[]): Provider {
  // 派生モデルは基盤モデルのタグよりも、明示された開発元を優先する。
  const provider = PROVIDERS.find((name) => tags.includes(name.toLowerCase()));
  if (provider) {
    return provider;
  }
  if (tags.some((tag) => ["openai", "gpt", "codex"].includes(tag))) {
    return "OpenAI";
  }
  if (
    tags.some(
      (tag) =>
        ["anthropic", "ahthropic"].includes(tag) || tag.startsWith("claude")
    )
  ) {
    return "Anthropic";
  }
  if (tags.some((tag) => ["google", "gemini", "nano banana"].includes(tag))) {
    return "Google";
  }
  if (tags.includes("deepseek")) {
    return "DeepSeek";
  }
  if (tags.some((tag) => ["qwen", "qwq", "qvq"].includes(tag))) {
    return "Alibaba";
  }
  if (tags.some((tag) => ["kimi", "moonshot"].includes(tag))) {
    return "Moonshot AI";
  }
  if (tags.includes("llama")) {
    return "Meta";
  }
  if (
    tags.some((tag) =>
      ["mistral", "mixtral", "codestral", "devstral"].includes(tag)
    )
  ) {
    return "Mistral AI";
  }
  if (tags.includes("grok")) {
    return "xAI";
  }
  if (tags.some((tag) => ["glm", "chatglm", "zhipu"].includes(tag))) {
    return "Z.ai";
  }
  if (tags.includes("phi")) {
    return "Microsoft";
  }
  return "Other";
}

function resolveKind(tags: string[]): ReleaseKind {
  if (tags.includes("llm model")) {
    return "llm";
  }
  if (tags.includes("image model")) {
    return "image";
  }
  if (tags.includes("audio model")) {
    return "audio";
  }
  if (tags.includes("agent")) {
    return "agent";
  }
  return "other";
}

/** 比較元は絞り込み前の全件。同日公開はまとめ、直前の異なる公開日を比較する。 */
export function buildReleases(entries: RenderedRelease[]): Release[] {
  const releases: Release[] = entries.map((item, index) => {
    const tags = (item.entry.tags ?? []).map((tag) => tag.toLowerCase());
    return {
      ...item,
      id: `release-${index}`,
      date: isExactDate(item.entry.date) ? item.entry.date : null,
      provider: resolveProvider(tags),
      kind: resolveKind(tags),
      series: [...new Set(item.entry.series)],
      intervals: [],
    };
  });
  const groups = new Map<
    string,
    { series: string; dates: Map<string, Release[]> }
  >();
  for (const release of releases) {
    if (!release.date) {
      continue;
    }
    for (const series of release.series) {
      const key = JSON.stringify([release.provider, release.kind, series]);
      const dates = groups.get(key)?.dates ?? new Map<string, Release[]>();
      const sameDay = dates.get(release.date) ?? [];
      sameDay.push(release);
      dates.set(release.date, sameDay);
      groups.set(key, { series, dates });
    }
  }
  for (const { series, dates } of groups.values()) {
    const sortedDates = [...dates.keys()].toSorted();
    for (const [index, date] of sortedDates.entries()) {
      const previousDate = sortedDates[index - 1];
      if (!previousDate) {
        continue;
      }
      for (const release of dates.get(date) ?? []) {
        release.intervals.push({
          series,
          previousDate,
          previousTitles: (dates.get(previousDate) ?? []).map(
            (item) => item.title
          ),
          days: daysBetween(previousDate, date),
        });
      }
    }
  }
  return releases.toSorted((a, b) => {
    if (a.date && b.date) {
      return b.date.localeCompare(a.date) || a.title.localeCompare(b.title);
    }
    if (a.date) {
      return -1;
    }
    if (b.date) {
      return 1;
    }
    return b.entry.year - a.entry.year;
  });
}

export type ReleaseFilters = {
  query: string;
  providers: string[];
  models: string[];
  titles: string[];
  kind: string;
};

/** 選択済みの値をトグルする。 */
export function toggleSelection(
  values: readonly string[],
  value: string
): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function sameSelection(
  a: readonly string[],
  b: readonly string[]
): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export type ReleaseModelOption = {
  name: string;
  provider: Provider;
  count: number;
};

function sortModelOptions(
  options: Iterable<ReleaseModelOption>
): ReleaseModelOption[] {
  const providerOrder = new Map(
    PROVIDERS.map((provider, index) => [provider, index])
  );
  return [...options].toSorted(
    (a, b) =>
      (providerOrder.get(a.provider) ?? PROVIDERS.length) -
        (providerOrder.get(b.provider) ?? PROVIDERS.length) ||
      a.name.localeCompare(b.name)
  );
}

/** モデル絞り込みに出す系列一覧。プロバイダの並び順でまとめる。 */
export function buildModelOptions(releases: Release[]): ReleaseModelOption[] {
  const options = new Map<string, ReleaseModelOption>();
  for (const release of releases) {
    for (const name of release.series) {
      const option = options.get(name);
      if (option) {
        option.count += 1;
      } else {
        options.set(name, { name, provider: release.provider, count: 1 });
      }
    }
  }
  return sortModelOptions(options.values());
}

/** モデル名(タイトル)での絞り込みに出す一覧。プロバイダの並び順でまとめる。 */
export function buildTitleOptions(releases: Release[]): ReleaseModelOption[] {
  const options = new Map<string, ReleaseModelOption>();
  for (const release of releases) {
    const option = options.get(release.title);
    if (option) {
      option.count += 1;
    } else {
      options.set(release.title, {
        name: release.title,
        provider: release.provider,
        count: 1,
      });
    }
  }
  return sortModelOptions(options.values());
}

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase();
}

export function filterReleases(
  releases: Release[],
  filters: ReleaseFilters
): Release[] {
  const terms = normalize(filters.query).trim().split(/\s+/u).filter(Boolean);
  const providers = new Set(filters.providers);
  const models = new Set(filters.models);
  const titles = new Set(filters.titles);
  const hasSelection = providers.size > 0 || models.size > 0 || titles.size > 0;
  return releases.filter((release) => {
    if (
      hasSelection &&
      !providers.has(release.provider) &&
      !release.series.some((series) => models.has(series)) &&
      !titles.has(release.title)
    ) {
      return false;
    }
    if (filters.kind && release.kind !== filters.kind) {
      return false;
    }
    const text = normalize(
      [
        release.title,
        release.provider,
        ...release.series,
        ...(release.entry.tags ?? []),
      ].join(" ")
    );
    return terms.every((term) => text.includes(term));
  });
}
