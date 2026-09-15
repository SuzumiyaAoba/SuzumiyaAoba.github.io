import { cache } from "react";

import {
  createContentReader,
  createContentCollection,
  listContentSlugs,
  normalizeArticleFrontmatter,
} from "@/shared/lib/content-file";
import type {
  ArticleFrontmatter,
  ContentSummary,
  LocalizedContent,
} from "@/shared/lib/content-file";

const NOTE_COLLECTION_DIR = "notes";

export type NoteFrontmatter = ArticleFrontmatter;

export type Note = {
  slug: string;
  content: string;
  format: "md" | "mdx";
  frontmatter: NoteFrontmatter;
};

export type NoteSummary = ContentSummary<Note>;

export const getNoteSlugs = cache(
  async (): Promise<string[]> => await listContentSlugs(NOTE_COLLECTION_DIR)
);

export const getNote = createContentReader(
  NOTE_COLLECTION_DIR,
  normalizeArticleFrontmatter
);

const collection = createContentCollection({
  getSlugs: getNoteSlugs,
  getContent: getNote,
});

export const getNoteSummary = collection.getSummary;

export type LocalizedNote = LocalizedContent<Note>;

export type LocalizedNoteSummary = LocalizedContent<NoteSummary>;

export const getNoteVariants = collection.getVariants;

export const getNotes = collection.getAll;

export const getNotesVariants = collection.getAllVariants;

export const getNoteSummaryVariants = collection.getSummaryVariants;

export const getNoteSummariesVariants = collection.getAllSummaryVariants;

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
