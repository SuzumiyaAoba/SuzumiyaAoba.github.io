import { notFound } from "next/navigation";

import {
  getAdjacentSections,
  getBookMeta,
  getBookSection,
  getBookToc,
} from "@/entities/book";
import { bookContentBasePath } from "@/shared/lib/books";
import { renderMdxWithToc } from "@/shared/lib/mdx";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { BookSectionPageContent } from "./page-content";

type PageProps = {
  params: Promise<{ book: string; chapter: string; section: string }>;
  locale?: Locale;
};

export default async function Page({ params, locale = "ja" }: PageProps) {
  const { book: bookSlug, chapter, section } = await params;

  const [meta, sectionData, chapters, adjacent] = await Promise.all([
    getBookMeta(bookSlug),
    getBookSection(bookSlug, chapter, section),
    getBookToc(bookSlug),
    getAdjacentSections(bookSlug, chapter, section),
  ]);

  if (!meta || !sectionData) {
    notFound();
  }

  const bookTitle = meta.frontmatter.title || bookSlug;
  const bookPath = toLocalePath(`/books/${bookSlug}`, locale);
  const sectionPath = toLocalePath(`/books/${bookSlug}/${chapter}/${section}`, locale);

  // 現在の章情報を chapters から取得
  const currentChapterData = chapters.find((ch) => ch.chapter === chapter);
  const chapterTitle = currentChapterData?.title ?? `第${parseInt(chapter, 10)}章`;
  const chapterNum = parseInt(chapter, 10);

  // MDX は {#id} を JavaScript 式として解釈するため、見出しのカスタム ID アノテーションを事前に除去する
  const sanitizedContent = sectionData.content.replace(
    /^(#{1,6}[^\n]*?)\s*\{#[^}]+\}\s*$/gm,
    "$1",
  );

  // MDX レンダリング（ToC 同時生成）
  const { content, headings } = await renderMdxWithToc(sanitizedContent, {
    basePath: bookContentBasePath(bookSlug),
    idPrefix: `${bookSlug}-${chapter}-${section}-`,
  });

  return (
    <BookSectionPageContent
      locale={locale}
      bookSlug={bookSlug}
      bookTitle={bookTitle}
      sectionTitle={sectionData.title}
      chapterTitle={chapterTitle}
      chapterNum={chapterNum}
      sectionPath={sectionPath}
      bookPath={bookPath}
      content={content}
      headings={headings}
      chapters={chapters}
      currentChapter={chapter}
      currentSection={section}
      prev={adjacent.prev}
      next={adjacent.next}
      llm={sectionData.llm ?? false}
      coAuthors={sectionData.coAuthors ?? []}
    />
  );
}
