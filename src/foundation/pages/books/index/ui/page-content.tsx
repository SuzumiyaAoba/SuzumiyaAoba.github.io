import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList, toLocalePath, type Locale } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { Card } from "@/shared/ui/card";

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

        {books.length > 0 ? (
          <ul className="max-w-3xl divide-y divide-border/40">
            {books.map((book) => (
              <li key={book.slug} className="py-4">
                <a
                  href={toLocalePath(`/books/${book.slug}`, locale)}
                  className="inline-flex flex-col gap-1 transition-colors hover:text-foreground/80"
                >
                  <span className="text-base font-medium break-words">{book.title}</span>
                  {book.date ? (
                    <span className="text-xs text-muted-foreground">{book.date}</span>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="border-transparent bg-card/40 shadow-none">
            <div className="px-5 py-6 text-sm text-muted-foreground">
              まだ書籍が公開されていません。
            </div>
          </Card>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
