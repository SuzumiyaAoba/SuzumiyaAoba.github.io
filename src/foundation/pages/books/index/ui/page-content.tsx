import { SiteLayout } from "@/widgets/site-layout";
import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { SimpleEntryListItem } from "@/shared/ui/simple-entry-list";
import { SimpleIndexPageContent } from "@/shared/ui/simple-index-page-content";

export type BookListEntry = {
  slug: string;
  title: string;
  date?: string;
};

export type BooksIndexPageContentProps = {
  locale: Locale;
  books: BookListEntry[];
};

export function BooksIndexPageContent({
  locale,
  books,
}: BooksIndexPageContentProps) {
  const pagePath = toLocalePath("/books", locale);

  const items: SimpleEntryListItem[] = books.map((book) => ({
    slug: book.slug,
    title: book.title,
    ...(book.date ? { date: book.date } : {}),
    href: toLocalePath(`/books/${book.slug}`, locale),
  }));

  return (
    <SiteLayout locale={locale} path={pagePath}>
      <SimpleIndexPageContent
        locale={locale}
        path="/books"
        breadcrumbName="Books"
        heading={{ ja: "Books", en: "Books" }}
        emptyMessage={{
          ja: "まだ書籍が公開されていません。",
          en: "No books have been published yet.",
        }}
        items={items}
      />
    </SiteLayout>
  );
}
