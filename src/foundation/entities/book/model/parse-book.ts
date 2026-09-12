import {
  asString,
  asStringWithDefault,
  asDateString,
  asBoolean,
  asStringArray,
  type ContentFormat,
} from "@/shared/lib/content-file";
import type { BookFrontmatter } from "./types";

export function normalizeBookFrontmatter(data: Record<string, unknown>): BookFrontmatter {
  const date = asDateString(data["date"]);
  const category = asString(data["category"]);
  const tags = asStringArray(data["tags"]);
  const llm = asBoolean(data["llm"]);

  // co-author は YAML の文字列配列。書籍ルールでは `["Claude Opus 4.7"]` のように複数可。
  const rawCoAuthors = data["co-author"];
  const coAuthors = typeof rawCoAuthors === "string" ? [rawCoAuthors] : asStringArray(rawCoAuthors);

  return {
    title: asStringWithDefault(data["title"], ""),
    ...(date ? { date } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(tags !== undefined ? { tags } : {}),
    ...(llm !== undefined ? { llm } : {}),
    ...(coAuthors && coAuthors.length > 0 ? { coAuthors } : {}),
  };
}

/**
 * index.md の本文から `## 第N章: タイトル` 形式の見出しをパースし、
 * 章番号（ゼロ埋め2桁）→タイトルの Map を返す。
 */
export function parseChapterTitles(content: string): Map<string, string> {
  const map = new Map<string, string>();
  // "## 第1章: タイトル {#...}" や "## 第1章：タイトル" に対応
  const regex = /^##\s+第(\d+)章[:：]\s+(.+?)(?:\s*\{#[^}]*\})?$/gm;
  for (const match of content.matchAll(regex)) {
    const num = parseInt(match[1]!, 10);
    const chapterKey = String(num).padStart(2, "0");
    const chapterTitle = match[2]!.trim();
    map.set(chapterKey, chapterTitle);
  }
  return map;
}

/** 目次と本文で同じファイル名規則を使い、画像などを節として読み込まない。 */
export function parseSectionFilename(filename: string): {
  section: string;
  format: ContentFormat;
} | null {
  const match = /^(\d+)(?:-.+)?\.(md|mdx)$/.exec(filename);
  if (!match) return null;
  return { section: match[1]!, format: match[2] === "mdx" ? "mdx" : "md" };
}
