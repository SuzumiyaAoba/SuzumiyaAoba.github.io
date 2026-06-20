import type { Locale } from "@/shared/lib/routing";
import { getBookMeta, getBookSlugs } from "@/entities/book";
import { BooksIndexPageContent, type BookListEntry } from "./page-content";

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale = "ja" }: PageProps) {
  const slugs = await getBookSlugs();
  const metas = await Promise.all(slugs.map((slug) => getBookMeta(slug)));

  const books: BookListEntry[] = metas
    .flatMap((meta) => (meta ? [meta] : []))
    .map((meta) => ({
      slug: meta.slug,
      title: meta.frontmatter.title || meta.slug,
      ...(meta.frontmatter.date ? { date: meta.frontmatter.date } : {}),
    }));

  return <BooksIndexPageContent locale={locale} books={books} />;
}
