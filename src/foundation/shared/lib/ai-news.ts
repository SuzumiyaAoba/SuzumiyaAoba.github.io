import fs from "node:fs/promises";
import path from "node:path";

import { parse } from "yaml";
import { z } from "zod";
import { resolveContentRoot } from "@/shared/lib/content-root";

/**
 * AIニュースのエントリ（出来事）の Zod スキーマ
 */
export const AiNewsEntrySchema = z.object({
  /** 発生した年 */
  year: z.coerce.number(),
  /** 発生した日付（任意） */
  date: z.string().optional(),
  /** タイトル（多言語） */
  title_ja: z.string().min(1),
  title_en: z.string().optional(),
  /** 要約（多言語） */
  summary_ja: z.string().min(1),
  summary_en: z.string().optional(),
  /** 関連するタグのリスト */
  tags: z.array(z.string()).optional(),
});

/**
 * 送出用の AIニュースエントリの型定義
 */
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

/**
 * AIニュースのソースファイル（YAML）の Zod スキーマ
 */
const AiNewsSourceSchema = z.object({
  version: z.number().optional(),
  updated: z.string().optional(),
  events: z.array(z.unknown()).optional(),
});

/**
 * 読み込まれたAIニュースのインデックス情報
 */
type AiNewsIndex = {
  entries: AiNewsEntry[];
  updated?: string;
  mtimeMs?: number;
};

/**
 * AIニュースのキャッシュ
 */
let cachedIndex: AiNewsIndex | null = null;

/**
 * 未加工のデータから AiNewsEntry を生成・正規化する
 * @param raw 未加工のオブジェクト
 * @returns 正規化されたエントリ。不完全な場合は null
 */
function normalizeEntry(raw: unknown): AiNewsEntry | null {
  const result = AiNewsEntrySchema.safeParse(raw);
  if (!result.success) {
    return null;
  }

  const { data } = result;
  return {
    year: data.year,
    ...(data.date ? { date: data.date } : {}),
    title: {
      ja: data.title_ja,
      ...(data.title_en ? { en: data.title_en } : {}),
    },
    summary: {
      ja: data.summary_ja,
      ...(data.summary_en ? { en: data.summary_en } : {}),
    },
    ...(data.tags && data.tags.length > 0 ? { tags: data.tags } : {}),
  };
}

/**
 * ニュースエントリを日付順（新しい順）にソートする
 * @param entries ソート前のエントリ
 * @returns ソート後のエントリ
 */
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

/**
 * AIニュースのデータをファイルから読み込む
 * 開発環境では変更を検知してリロードする
 * @returns ニュース全体のインデックス情報
 */
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
    const data = parse(raw);
    const result = AiNewsSourceSchema.safeParse(data);

    if (!result.success) {
      throw new Error("Invalid AI news source format");
    }

    const parsed = result.data;
    const events = parsed.events ?? [];
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

/**
 * すべてのAIニュースエントリを取得する
 * @returns ニュースエントリの配列
 */
export async function getAiNewsEntries(): Promise<AiNewsEntry[]> {
  const index = await loadAiNews();
  return index.entries;
}

/**
 * データが最後に更新された日時を取得する
 * @returns 更新日時文字列
 */
export async function getAiNewsUpdated(): Promise<string | undefined> {
  const index = await loadAiNews();
  return index.updated;
}
