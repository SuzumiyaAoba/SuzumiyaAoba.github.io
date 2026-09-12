import { cache } from "react";
import { parseContent, resolveContentRoot } from "@/shared/lib/content-file";
import { normalizeBookFrontmatter, parseSectionFilename } from "./parse-book";

async function readBookFile(...segments: string[]) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const root = await resolveContentRoot();
  return fs.readFile(path.join(root, "books", ...segments), "utf8");
}

/** 概要と章タイトルで、index.md の読み込み・解析結果を共有する。 */
export const readBookIndex = cache(async (bookSlug: string) => {
  const raw = await readBookFile(bookSlug, "index.md").catch(() => null);
  return raw ? parseContent(raw, normalizeBookFrontmatter) : null;
});

export const listBookSectionFiles = cache(async (bookSlug: string, chapter: string) => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const root = await resolveContentRoot();
  const directory = path.join(root, "books", bookSlug, "parts", chapter, "chapters");
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort()
      .flatMap((filename) => {
        const section = parseSectionFilename(filename);
        return section ? [{ filename, ...section }] : [];
      });
  } catch {
    return null;
  }
});

/** 読み込めない節は、目次ではファイル名表示、本文ページでは404にする。 */
export const readBookSectionFile = cache(
  async (bookSlug: string, chapter: string, filename: string) => {
    try {
      const raw = await readBookFile(bookSlug, "parts", chapter, "chapters", filename);
      return parseContent(raw, normalizeBookFrontmatter);
    } catch {
      return null;
    }
  },
);
