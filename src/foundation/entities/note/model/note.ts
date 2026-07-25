import matter from "gray-matter";
import { cache } from "react";
import type { Locale } from "@/shared/lib/routing";

import {
  createArticleFileLister,
  readContentFileWithFallback,
  listContentSlugs,
  asString,
  asStringWithDefault,
  asDateString,
  asBoolean,
  asStringArray,
} from "@/shared/lib/content-file";

const NOTE_COLLECTION_DIR = "notes";

export type NoteFrontmatter = {
  title: string;
  date?: string;
  category?: string;
  description?: string;
  tags?: string[];
  thumbnail?: string;
  draft?: boolean;
  amazonAssociate?: boolean;
  amazonProductIds?: string[];
  model?: string;
};

export type Note = {
  slug: string;
  content: string;
  format: "md" | "mdx";
  frontmatter: NoteFrontmatter;
};

export type NoteSummary = {
  slug: string;
  frontmatter: NoteFrontmatter;
};

type ReadContentOptions = {
  locale?: Locale;
  fallback?: boolean;
};

const listNoteArticleFiles = createArticleFileLister(NOTE_COLLECTION_DIR);

export const getNoteSlugs = cache(async (): Promise<string[]> => listContentSlugs(NOTE_COLLECTION_DIR));

export const getNote = cache(
  async (slug: string, options?: ReadContentOptions): Promise<Note | null> => {
    const file = await readContentFileWithFallback(
      NOTE_COLLECTION_DIR,
      slug,
      listNoteArticleFiles,
      options,
    );
    if (!file) {
      return null;
    }

    const { content, data } = matter(file.raw);
    const frontmatter = normalizeFrontmatter(data);

    return {
      slug,
      content,
      format: file.format,
      frontmatter,
    };
  },
);

export const getNoteSummary = cache(
  async (slug: string, options?: ReadContentOptions): Promise<NoteSummary | null> => {
    const file = await readContentFileWithFallback(
      NOTE_COLLECTION_DIR,
      slug,
      listNoteArticleFiles,
      options,
    );
    if (!file) {
      return null;
    }

    const { data } = matter(file.raw);
    const frontmatter = normalizeFrontmatter(data);

    return {
      slug,
      frontmatter,
    };
  },
);

function normalizeFrontmatter(data: Record<string, unknown>): NoteFrontmatter {
  const date = asDateString(data["date"]);
  const category = asString(data["category"]);
  const description = asString(data["description"]);
  const tags = asStringArray(data["tags"]);
  const thumbnail = asString(data["thumbnail"]);
  const draft = asBoolean(data["draft"]);
  const amazonAssociate = asBoolean(data["amazonAssociate"]);
  const amazonProductIds = asStringArray(data["amazonProductIds"]);
  const model = asString(data["model"]);

  return {
    title: asStringWithDefault(data["title"], ""),
    ...(date ? { date } : {}),
    ...(category !== undefined ? { category } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(tags !== undefined ? { tags } : {}),
    ...(thumbnail !== undefined ? { thumbnail } : {}),
    ...(draft !== undefined ? { draft } : {}),
    ...(amazonAssociate !== undefined ? { amazonAssociate } : {}),
    ...(amazonProductIds !== undefined ? { amazonProductIds } : {}),
    ...(model !== undefined ? { model } : {}),
  };
}

export type LocalizedNote = {
  slug: string;
  ja: Note | null;
  en: Note | null;
};

export type LocalizedNoteSummary = {
  slug: string;
  ja: NoteSummary | null;
  en: NoteSummary | null;
};

function compareLocalizedNotes(
  a: LocalizedNote | LocalizedNoteSummary,
  b: LocalizedNote | LocalizedNoteSummary,
) {
  const dateA = (a.ja ?? a.en)?.frontmatter.date ?? "";
  const dateB = (b.ja ?? b.en)?.frontmatter.date ?? "";

  if (dateA && dateB && dateA !== dateB) {
    return dateA < dateB ? 1 : -1;
  }
  if (dateA) {
    return -1;
  }
  if (dateB) {
    return 1;
  }

  return a.slug.localeCompare(b.slug);
}

export const getNoteVariants = cache(async (slug: string): Promise<LocalizedNote> => {
  const [ja, en] = await Promise.all([
    getNote(slug, { locale: "ja", fallback: false }),
    getNote(slug, { locale: "en", fallback: false }),
  ]);

  return { slug, ja, en };
});

export const getNotes = cache(async (): Promise<Note[]> => {
  const slugs = await getNoteSlugs();
  const notes = await Promise.all(slugs.map((slug) => getNote(slug)));

  return notes
    .filter((note): note is Note => Boolean(note))
    .filter((note) => !note.frontmatter.draft)
    .sort((a, b) =>
      compareLocalizedNotes({ slug: a.slug, ja: a, en: null }, { slug: b.slug, ja: b, en: null }),
    );
});

export const getNotesVariants = cache(async (): Promise<LocalizedNote[]> => {
  const slugs = await getNoteSlugs();
  const notes = await Promise.all(slugs.map((slug) => getNoteVariants(slug)));

  return notes
    .filter((note) => {
      const reference = note.ja ?? note.en;
      if (!reference) {
        return false;
      }
      return !reference.frontmatter.draft;
    })
    .sort(compareLocalizedNotes);
});

/**
 * 公開済み（下書きでない）ノートのスラッグ一覧を取得する。
 * generateStaticParams など、下書きを静的ビルド対象・公開 URL に
 * 含めてはいけない場面ではこちらを使う（getNoteSlugs は下書きを含む全件を返す）。
 * @returns スラッグの配列
 */
export const getPublishedNoteSlugs = cache(async (): Promise<string[]> => {
  const notes = await getNotesVariants();
  return notes.map((note) => note.slug);
});

export const getNoteSummaryVariants = cache(async (slug: string): Promise<LocalizedNoteSummary> => {
  const [ja, en] = await Promise.all([
    getNoteSummary(slug, { locale: "ja", fallback: false }),
    getNoteSummary(slug, { locale: "en", fallback: false }),
  ]);

  return { slug, ja, en };
});

export const getNoteSummariesVariants = cache(async (): Promise<LocalizedNoteSummary[]> => {
  const slugs = await getNoteSlugs();
  const notes = await Promise.all(slugs.map((slug) => getNoteSummaryVariants(slug)));

  return notes
    .filter((note) => {
      const reference = note.ja ?? note.en;
      if (!reference) {
        return false;
      }
      return !reference.frontmatter.draft;
    })
    .sort(compareLocalizedNotes);
});
