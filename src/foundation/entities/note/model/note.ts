import { cache } from "react";

import {
  createContentReader,
  createContentCollection,
  listContentSlugs,
  asString,
  asStringWithDefault,
  asDateString,
  asBoolean,
  asStringArray,
  type ContentSummary,
  type LocalizedContent,
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

export type NoteSummary = ContentSummary<Note>;

export const getNoteSlugs = cache(async (): Promise<string[]> =>
  listContentSlugs(NOTE_COLLECTION_DIR),
);

export const getNote = createContentReader(NOTE_COLLECTION_DIR, normalizeFrontmatter);

const collection = createContentCollection({ getSlugs: getNoteSlugs, getContent: getNote });

export const getNoteSummary = collection.getSummary;

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

export type LocalizedNote = LocalizedContent<Note>;

export type LocalizedNoteSummary = LocalizedContent<NoteSummary>;

export const getNoteVariants = collection.getVariants;

export const getNotes = collection.getAll;

export const getNotesVariants = collection.getAllVariants;

/**
 * 公開済み（下書きでない）ノートのスラッグ一覧を取得する。
 * generateStaticParams など、下書きを静的ビルド対象・公開 URL に
 * 含めてはいけない場面ではこちらを使う（getNoteSlugs は下書きを含む全件を返す）。
 * @returns スラッグの配列
 */
export const getPublishedNoteSlugs = cache(async (): Promise<string[]> => {
  const notes = await getNoteSummariesVariants();
  return notes.map((note) => note.slug);
});

export const getNoteSummaryVariants = collection.getSummaryVariants;

export const getNoteSummariesVariants = collection.getAllSummaryVariants;
