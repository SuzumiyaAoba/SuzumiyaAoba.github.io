import type { ReactElement } from "react";
import { SiteLayout } from "@/widgets/site-layout";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import {
  buildBreadcrumbList,
  buildDetailBreadcrumbItems,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
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
  const breadcrumbItems = buildDetailBreadcrumbItems(
    locale,
    { name: "Books", path: "/books" },
    { name: bookTitle, path: bookPath }
  );

  return (
    <SiteLayout locale={locale} path={bookPath}>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main-reading page-stack">
        <div>
          <Breadcrumbs items={breadcrumbItems} className="mb-4" />
          <h1 className="text-2xl leading-snug font-semibold sm:text-3xl">
            {bookTitle}
          </h1>
        </div>

        {leadContent ? (
          <div className="prose max-w-none font-serif">{leadContent}</div>
        ) : null}

        <nav aria-label="目次" className="space-y-4">
          <h2 className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            目次
          </h2>
          <div className="space-y-5">
            {chapters.map((ch) => (
              <section key={ch.chapter} className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">
                  第{Number.parseInt(ch.chapter, 10)}章 — {ch.title}
                </h3>
                <ol className="space-y-1 pl-4">
                  {ch.sections.map((sec) => (
                    <li key={`${sec.chapter}-${sec.section}`}>
                      <a
                        href={toLocalePath(
                          `/books/${bookSlug}/${sec.chapter}/${sec.section}`,
                          locale
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
    </SiteLayout>
  );
}
