import { cache } from "react";
import { listContentSlugs, findAdjacentByIndex } from "@/shared/lib/content-file";
import { listBookSectionFiles, readBookIndex, readBookSectionFile } from "./book-files";
import { parseChapterTitles } from "./parse-book";
import type { BookChapter, BookMeta, BookSection, SectionRef } from "./types";

/** `content/books` 直下の書籍スラッグを昇順で返す。 */
export const getBookSlugs = cache(async (): Promise<string[]> => listContentSlugs("books"));

/** 書籍の概要を返す。index.md がなければ null。 */
export const getBookMeta = cache(async (bookSlug: string): Promise<BookMeta | null> => {
  const index = await readBookIndex(bookSlug);
  if (!index) return null;

  const { content, frontmatter } = index;
  const separatorIndex = content.indexOf("\n---\n");
  const lead = (separatorIndex >= 0 ? content.slice(0, separatorIndex) : content).trim();
  return { slug: bookSlug, frontmatter, lead };
});

/** 章・節の番号順に目次を返す。章タイトルは index.md の見出しから取得する。 */
export const getBookToc = cache(async (bookSlug: string): Promise<BookChapter[]> => {
  const [index, chapters] = await Promise.all([
    readBookIndex(bookSlug),
    listContentSlugs(`books/${bookSlug}/parts`),
  ]);
  const titles = parseChapterTitles(index?.content ?? "");
  const toc = await Promise.all(
    chapters.map(async (chapter): Promise<BookChapter | null> => {
      const files = await listBookSectionFiles(bookSlug, chapter);
      if (!files) return null;

      const sections = await Promise.all(
        files.map(async ({ filename, section }): Promise<SectionRef> => {
          const parsed = await readBookSectionFile(bookSlug, chapter, filename);
          return { chapter, section, title: parsed?.frontmatter.title || filename };
        }),
      );
      return {
        chapter,
        title: titles.get(chapter) ?? `第${Number.parseInt(chapter, 10)}章`,
        sections,
      };
    }),
  );
  return toc.filter((chapter) => chapter !== null);
});

/** 目次と同じ探索規則で、指定した章・節の本文を返す。 */
export const getBookSection = cache(
  async (bookSlug: string, chapter: string, section: string): Promise<BookSection | null> => {
    const files = await listBookSectionFiles(bookSlug, chapter);
    const file = files?.find((candidate) => candidate.section === section);
    if (!file) return null;

    const parsed = await readBookSectionFile(bookSlug, chapter, file.filename);
    if (!parsed) return null;

    const { content, frontmatter } = parsed;
    return {
      chapter,
      section,
      title: frontmatter.title || file.filename,
      content,
      format: file.format,
      ...(frontmatter.llm !== undefined ? { llm: frontmatter.llm } : {}),
      ...(frontmatter.coAuthors ? { coAuthors: frontmatter.coAuthors } : {}),
    };
  },
);

/** 章をまたいで前後の節を返す。 */
export const getAdjacentSections = cache(
  async (
    bookSlug: string,
    chapter: string,
    section: string,
  ): Promise<{ prev: SectionRef | null; next: SectionRef | null }> => {
    const toc = await getBookToc(bookSlug);
    return findAdjacentByIndex(
      toc.flatMap((entry) => entry.sections),
      (entry) => entry.chapter === chapter && entry.section === section,
      { prevOffset: -1, nextOffset: 1 },
    );
  },
);
