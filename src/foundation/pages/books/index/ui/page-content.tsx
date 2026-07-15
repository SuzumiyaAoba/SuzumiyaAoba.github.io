import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { type SimpleEntryListItem } from "@/shared/ui/simple-entry-list";
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

export function BooksIndexPageContent({ locale, books }: BooksIndexPageContentProps) {
  const pagePath = toLocalePath("/books", locale);

  const items: SimpleEntryListItem[] = books.map((book) => ({
    slug: book.slug,
    title: book.title,
    ...(book.date ? { date: book.date } : {}),
    href: toLocalePath(`/books/${book.slug}`, locale),
  }));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <SimpleIndexPageContent
        locale={locale}
        path="/books"
        breadcrumbName="Books"
        heading={{ ja: "Books", en: "Books" }}
        description={{
          ja: "プログラミングや技術に関する入門書・解説書を公開しています。",
          en: "Publishing introductory books and guides on programming and technology.",
        }}
        emptyMessage={{
          ja: "まだ書籍が公開されていません。",
          en: "No books have been published yet.",
        }}
        items={items}
      />
      <Footer locale={locale} />
    </div>
  );
}
