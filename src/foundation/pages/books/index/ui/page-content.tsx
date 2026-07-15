import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList, toLocalePath, type Locale } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { Card } from "@/shared/ui/card";
import { SimpleEntryList, type SimpleEntryListItem } from "@/shared/ui/simple-entry-list";

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
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Books", path: pagePath },
        ])}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Books
          </h1>
          <div className="max-w-3xl space-y-3">
            <p className="text-sm leading-7 text-muted-foreground">
              プログラミングや技術に関する入門書・解説書を公開しています。
            </p>
          </div>
        </section>

        <SimpleEntryList
          items={items}
          emptyState={
            <Card className="border-transparent bg-card/40 shadow-none">
              <div className="px-5 py-6 text-sm text-muted-foreground">
                まだ書籍が公開されていません。
              </div>
            </Card>
          }
        />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
