import fs from "node:fs/promises";
import path from "node:path";

import { parse } from "yaml";
import { resolveContentRoot } from "@/shared/lib/content-root";

export type AiNewsEntry = {
  year: number;
  date?: string;
  title: {
    ja: string;
    en?: string;
  };
  summary: {
    ja: string;
    en?: string;
  };
  tags?: string[];
};

type AiNewsSource = {
  version?: number;
  updated?: string;
  events?: unknown;
};

type AiNewsIndex = {
  entries: AiNewsEntry[];
  updated?: string;
  mtimeMs?: number;
};

let cachedIndex: AiNewsIndex | null = null;

function normalizeEntry(raw: unknown): AiNewsEntry | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const value = raw as Record<string, unknown>;
  const yearValue = value["year"];
  const year = typeof yearValue === "number" ? yearValue : Number(yearValue);
  if (!Number.isFinite(year)) {
    return null;
  }

  const titleJa = typeof value["title_ja"] === "string" ? value["title_ja"] : null;
  const titleEn = typeof value["title_en"] === "string" ? value["title_en"] : undefined;
  const summaryJa = typeof value["summary_ja"] === "string" ? value["summary_ja"] : null;
  const summaryEn = typeof value["summary_en"] === "string" ? value["summary_en"] : undefined;

  if (titleJa === null || summaryJa === null) {
    return null;
  }

  const date = typeof value["date"] === "string" ? value["date"] : undefined;
  const tags = Array.isArray(value["tags"])
    ? value["tags"].filter((tag): tag is string => typeof tag === "string")
    : undefined;

  return {
    year,
    ...(date ? { date } : {}),
    title: {
      ja: titleJa,
      ...(titleEn ? { en: titleEn } : {}),
    },
    summary: {
      ja: summaryJa,
      ...(summaryEn ? { en: summaryEn } : {}),
    },
    ...(tags && tags.length > 0 ? { tags } : {}),
  };
}

function sortEntries(entries: AiNewsEntry[]): AiNewsEntry[] {
  return [...entries].sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    if (a.date && b.date) {
      return b.date.localeCompare(a.date);
    }
    if (a.date) {
      return -1;
    }
    if (b.date) {
      return 1;
    }
    return (a.title.en ?? a.title.ja).localeCompare(b.title.en ?? b.title.ja);
  });
}

async function loadAiNews(): Promise<AiNewsIndex> {
  const root = await resolveContentRoot();
  const filePath = path.join(root, "tools", "ai-news.yaml");
  const isDev = process.env["NODE_ENV"] === "development";

  if (cachedIndex && !isDev) {
    return cachedIndex;
  }

  try {
    let mtimeMs: number | undefined = undefined;
    if (isDev) {
      try {
        const stat = await fs.stat(filePath);
        mtimeMs = stat.mtimeMs;
        if (cachedIndex && cachedIndex.mtimeMs === mtimeMs) {
          return cachedIndex;
        }
      } catch {
        // fall through to read/parse
      }
    }

    const raw = await fs.readFile(filePath, "utf8");
    const parsed = parse(raw) as AiNewsSource;
    const events = Array.isArray(parsed?.events) ? parsed.events : [];
    const entries = events.map(normalizeEntry).filter((entry): entry is AiNewsEntry => {
      return Boolean(entry);
    });
    const sorted = sortEntries(entries);

    const updated = typeof parsed.updated === "string" ? parsed.updated : undefined;
    const index: AiNewsIndex = {
      entries: sorted,
      ...(updated ? { updated } : {}),
    };
    if (typeof mtimeMs === "number") {
      index.mtimeMs = mtimeMs;
    }

    cachedIndex = index;
    return index;
  } catch {
    const emptyIndex: AiNewsIndex = { entries: [] };
    cachedIndex = emptyIndex;
    return emptyIndex;
  }
}

export async function getAiNewsEntries(): Promise<AiNewsEntry[]> {
  const index = await loadAiNews();
  return index.entries;
}

export async function getAiNewsUpdated(): Promise<string | undefined> {
  const index = await loadAiNews();
  return index.updated;
}
