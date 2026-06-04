import type { ReactElement } from "react";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { buildBreadcrumbList, toLocalePath, type Locale } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import type { BookChapter } from "@/entities/book";

export type BookDetailPageContentProps = {
  locale: Locale;
  bookSlug: string;
  bookTitle: string;
  bookPath: string;
  leadContent: ReactElement | null;
  chapters: BookChapter[];
};

export function BookDetailPageContent({
  locale,
  bookSlug,
  bookTitle,
  bookPath,
  leadContent,
  chapters,
}: BookDetailPageContentProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={bookPath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Books", path: toLocalePath("/books", locale) },
          { name: bookTitle, path: bookPath },
        ])}
      />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <div>
          <Breadcrumbs
            items={[
              { name: "Home", path: toLocalePath("/", locale) },
              { name: "Books", path: toLocalePath("/books", locale) },
              { name: bookTitle, path: bookPath },
            ]}
            className="mb-4"
          />
          <h1 className="text-3xl font-semibold">{bookTitle}</h1>
        </div>

        {leadContent ? (
          <div className="prose prose-neutral max-w-none font-sans">{leadContent}</div>
        ) : null}

        <nav aria-label="目次" className="space-y-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            目次
          </h2>
          <div className="space-y-6">
            {chapters.map((ch) => (
              <section key={ch.chapter} className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  第{parseInt(ch.chapter, 10)}章 — {ch.title}
                </h3>
                <ol className="space-y-1 pl-4">
                  {ch.sections.map((sec) => (
                    <li key={`${sec.chapter}-${sec.section}`}>
                      <a
                        href={toLocalePath(
                          `/books/${bookSlug}/${sec.chapter}/${sec.section}`,
                          locale,
                        )}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {sec.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </nav>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
