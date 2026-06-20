import matter from "gray-matter";
import { cache } from "react";

import { resolveContentRoot } from "@/shared/lib/content-root";

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

export type BookFrontmatter = {
  title: string;
  date?: string;
  category?: string;
  tags?: string[];
};

/** 書籍のトップ情報（概要 + frontmatter）。 */
export type BookMeta = {
  slug: string;
  frontmatter: BookFrontmatter;
  /** index.md の最初の区切り（\n---\n）より前の本文。書籍概要として表示する。 */
  lead: string;
};

/** 節の軽量参照情報（ナビゲーション用）。 */
export type SectionRef = {
  /** 章番号（ゼロ埋め2桁。例: "01"） */
  chapter: string;
  /** 節番号（ゼロ埋め2桁。例: "01"） */
  section: string;
  /** 節のタイトル */
  title: string;
};

/** 章タイトルと配下の節リスト。 */
export type BookChapter = {
  /** 章番号（ゼロ埋め2桁） */
  chapter: string;
  /** 章タイトル */
  title: string;
  /** この章に属する節のリスト */
  sections: SectionRef[];
};

/** 本文付きの節情報（ページ表示用）。 */
export type BookSection = SectionRef & {
  /** 節の本文（Markdown / MDX ソース） */
  content: string;
  format: "md" | "mdx";
};

// ---------------------------------------------------------------------------
// 内部ヘルパー
// ---------------------------------------------------------------------------

function normalizeFrontmatter(data: Record<string, unknown>): BookFrontmatter {
  const title = typeof data["title"] === "string" ? data["title"] : "";
  const dateValue = data["date"];
  const date =
    dateValue instanceof Date
      ? dateValue.toISOString().slice(0, 10)
      : typeof dateValue === "string"
        ? dateValue
        : undefined;

  return {
    title,
    ...(date ? { date } : {}),
    ...(typeof data["category"] === "string" ? { category: data["category"] } : {}),
    ...(Array.isArray(data["tags"])
      ? { tags: data["tags"].filter((tag): tag is string => typeof tag === "string") }
      : {}),
  };
}

/**
 * index.md の本文から `## 第N章: タイトル` 形式の見出しをパースし、
 * 章番号（ゼロ埋め2桁）→タイトルの Map を返す。
 */
function parseChapterTitles(content: string): Map<string, string> {
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

/** index.md の生テキストを読み込む（内部キャッシュ用）。 */
const readBookIndexRaw = cache(async (bookSlug: string): Promise<string | null> => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const root = await resolveContentRoot();
  const indexPath = path.join(root, "books", bookSlug, "index.md");

  try {
    return await fs.readFile(indexPath, "utf8");
  } catch {
    return null;
  }
});

// ---------------------------------------------------------------------------
// 公開 API
// ---------------------------------------------------------------------------

/** `content/books` 直下のディレクトリ名（書籍スラッグ）を昇順で返す。 */
export const getBookSlugs = cache(async (): Promise<string[]> => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const root = await resolveContentRoot();
  const booksRoot = path.join(root, "books");

  try {
    const entries = await fs.readdir(booksRoot, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
});

/**
 * 書籍のトップ情報（frontmatter + リード文）を返す。
 * index.md が存在しない場合は null。
 */
export const getBookMeta = cache(async (bookSlug: string): Promise<BookMeta | null> => {
  const raw = await readBookIndexRaw(bookSlug);
  if (!raw) {
    return null;
  }

  const { content, data } = matter(raw);
  const frontmatter = normalizeFrontmatter(data);

  // 最初の "\n---\n" より前の本文をリード文として使う
  const separatorIndex = content.indexOf("\n---\n");
  const lead = separatorIndex >= 0 ? content.slice(0, separatorIndex).trim() : content.trim();

  return { slug: bookSlug, frontmatter, lead };
});

/**
 * 書籍の目次（章 > 節 の階層構造）を返す。
 * 章タイトルは index.md の `## 第N章:` 見出しから取得する。
 */
export const getBookToc = cache(async (bookSlug: string): Promise<BookChapter[]> => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const root = await resolveContentRoot();
  const partsRoot = path.join(root, "books", bookSlug, "parts");

  // index.md の全本文から章タイトルを取得
  const raw = await readBookIndexRaw(bookSlug);
  const titleMap = raw ? parseChapterTitles(matter(raw).content) : new Map<string, string>();

  try {
    const partEntries = await fs.readdir(partsRoot, { withFileTypes: true });
    const chapterDirs = partEntries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();

    const chapters: BookChapter[] = [];

    for (const chapter of chapterDirs) {
      const chaptersDir = path.join(partsRoot, chapter, "chapters");

      try {
        const sectionEntries = await fs.readdir(chaptersDir, { withFileTypes: true });
        const sectionFiles = sectionEntries
          .filter((e) => e.isFile() && (e.name.endsWith(".md") || e.name.endsWith(".mdx")))
          .map((e) => e.name)
          .sort();

        const sections: SectionRef[] = [];

        for (const filename of sectionFiles) {
          // ファイル名は `{MM}-{slug}.md` 形式
          const match = filename.match(/^(\d+)-(.+)\.(md|mdx)$/);
          if (!match) {
            continue;
          }
          const sectionNum = match[1]!;
          const filePath = path.join(chaptersDir, filename);

          try {
            const fileRaw = await fs.readFile(filePath, "utf8");
            const { data } = matter(fileRaw);
            const fm = normalizeFrontmatter(data);
            sections.push({
              chapter,
              section: sectionNum,
              title: fm.title || filename,
            });
          } catch {
            sections.push({ chapter, section: sectionNum, title: filename });
          }
        }

        const chapterNum = parseInt(chapter, 10);
        const chapterTitle = titleMap.get(chapter) ?? `第${chapterNum}章`;

        chapters.push({ chapter, title: chapterTitle, sections });
      } catch {
        continue;
      }
    }

    return chapters;
  } catch {
    return [];
  }
});

/**
 * 指定した章・節の本文を返す。
 * `parts/{chapter}/chapters/{section}-*.md(x)` を前方一致で探す。
 */
export const getBookSection = cache(
  async (
    bookSlug: string,
    chapter: string,
    section: string,
  ): Promise<BookSection | null> => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");

    const root = await resolveContentRoot();
    const chaptersDir = path.join(root, "books", bookSlug, "parts", chapter, "chapters");

    try {
      const entries = await fs.readdir(chaptersDir, { withFileTypes: true });
      const targetFile = entries
        .filter((e) => e.isFile())
        .find(
          (e) =>
            e.name.startsWith(`${section}-`) ||
            e.name === `${section}.md` ||
            e.name === `${section}.mdx`,
        );

      if (!targetFile) {
        return null;
      }

      const filePath = path.join(chaptersDir, targetFile.name);
      const fileRaw = await fs.readFile(filePath, "utf8");
      const { content, data } = matter(fileRaw);
      const fm = normalizeFrontmatter(data);
      const format: "md" | "mdx" = targetFile.name.endsWith(".mdx") ? "mdx" : "md";

      return {
        chapter,
        section,
        title: fm.title || targetFile.name,
        content,
        format,
      };
    } catch {
      return null;
    }
  },
);

/**
 * 指定した章・節の前後の節を返す（章をまたぐ）。
 * 存在しない場合は null。
 */
export const getAdjacentSections = cache(
  async (
    bookSlug: string,
    chapter: string,
    section: string,
  ): Promise<{ prev: SectionRef | null; next: SectionRef | null }> => {
    const toc = await getBookToc(bookSlug);
    const flat = toc.flatMap((ch) => ch.sections);
    const idx = flat.findIndex((s) => s.chapter === chapter && s.section === section);

    if (idx < 0) {
      return { prev: null, next: null };
    }

    return {
      prev: idx > 0 ? (flat[idx - 1] ?? null) : null,
      next: idx < flat.length - 1 ? (flat[idx + 1] ?? null) : null,
    };
  },
);
