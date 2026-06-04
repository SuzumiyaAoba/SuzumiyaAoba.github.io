import type { Metadata } from "next";

import BookSectionPage from "@/pages/books/section";
import { getBookMeta, getBookSection, getBookSlugs, getBookToc } from "@/entities/book";

type PageProps = {
  params: Promise<{ book: string; chapter: string; section: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { book, chapter, section } = await params;
  const [sectionData, meta] = await Promise.all([
    getBookSection(book, chapter, section),
    getBookMeta(book),
  ]);
  const sectionTitle = sectionData?.title || section;
  const bookTitle = meta?.frontmatter.title || book;
  return { title: `${sectionTitle} | ${bookTitle}` };
}

export async function generateStaticParams(): Promise<
  Array<{ book: string; chapter: string; section: string }>
> {
  const slugs = await getBookSlugs();
  const results: Array<{ book: string; chapter: string; section: string }> = [];

  for (const book of slugs) {
    const toc = await getBookToc(book);
    for (const ch of toc) {
      for (const sec of ch.sections) {
        results.push({ book, chapter: sec.chapter, section: sec.section });
      }
    }
  }

  return results;
}

export default function Page(props: PageProps) {
  return <BookSectionPage {...props} />;
}
