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
        <Breadcrumbs items={breadcrumbItems} />
        <header className="page-heading">
          <div>
            <p className="page-eyebrow">書籍</p>
            <h1 className="page-title">{bookTitle}</h1>
          </div>
        </header>

        {leadContent ? (
          <div className="prose max-w-none">{leadContent}</div>
        ) : null}

        {/* 本の目次。節の題と節番号をリーダーでつなぐ。 */}
        <nav aria-label="目次" className="book-toc">
          <h2 className="book-toc-title">目次</h2>
          {chapters.map((ch) => {
            const chapterNumber = Number.parseInt(ch.chapter, 10);
            return (
              <section key={ch.chapter} className="book-toc-chapter">
                <h3 className="book-toc-chapter-title">
                  <span className="book-toc-chapter-number">
                    第{chapterNumber}章
                  </span>
                  {ch.title}
                </h3>
                <ol>
                  {ch.sections.map((sec) => (
                    <li key={`${sec.chapter}-${sec.section}`}>
                      <a
                        href={toLocalePath(
                          `/books/${bookSlug}/${sec.chapter}/${sec.section}`,
                          locale
                        )}
                        className="leader-link"
                      >
                        <span>{sec.title}</span>
                        <span>
                          {chapterNumber}.{Number.parseInt(sec.section, 10)}
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </nav>
      </main>
    </SiteLayout>
  );
}
