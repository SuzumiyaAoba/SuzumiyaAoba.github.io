import type { ReactElement } from "react";
import { SiteLayout } from "@/widgets/site-layout";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { buildBreadcrumbList, toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { Message } from "@/shared/ui/mdx";
import type { BookChapter, SectionRef } from "@/entities/book";
import type { TocHeading } from "@/shared/lib/mdx";
import { BookNav } from "./book-nav";
import { Toc } from "./toc";

export type BookSectionPageContentProps = {
  locale: Locale;
  bookSlug: string;
  bookTitle: string;
  sectionTitle: string;
  chapterTitle: string;
  chapterNum: number;
  sectionPath: string;
  bookPath: string;
  content: ReactElement;
  headings: TocHeading[];
  chapters: BookChapter[];
  currentChapter: string;
  currentSection: string;
  prev: SectionRef | null;
  next: SectionRef | null;
  /** LLM を使って執筆した節かどうか。true のとき本文上部に注記を表示する。 */
  llm: boolean;
  /** 執筆に使った LLM モデル名。注記内に列挙する。 */
  coAuthors: string[];
};

export function BookSectionPageContent({
  locale,
  bookSlug,
  bookTitle,
  sectionTitle,
  chapterTitle,
  chapterNum,
  sectionPath,
  bookPath,
  content,
  headings,
  chapters,
  currentChapter,
  currentSection,
  prev,
  next,
  llm,
  coAuthors,
}: BookSectionPageContentProps) {
  return (
    <SiteLayout locale={locale} path={sectionPath}>
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Books", path: toLocalePath("/books", locale) },
          { name: bookTitle, path: bookPath },
          { name: sectionTitle, path: sectionPath },
        ])}
      />
      <div className="site-container-wide flex flex-1 gap-0">
        {/* 左: 章節ナビ */}
        <aside className="hidden w-60 shrink-0 pt-6 pb-10 xl:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-4">
            <BookNav
              locale={locale}
              bookSlug={bookSlug}
              bookTitle={bookTitle}
              chapters={chapters}
              currentChapter={currentChapter}
              currentSection={currentSection}
            />
          </div>
        </aside>

        {/* 中央: 本文 */}
        <main className="min-w-0 flex-1 px-0 pt-6 pb-10 xl:px-8">
          <Breadcrumbs
            items={[
              { name: "Home", path: toLocalePath("/", locale) },
              { name: "Books", path: toLocalePath("/books", locale) },
              { name: bookTitle, path: bookPath },
              { name: `第${chapterNum}章`, path: bookPath },
              { name: sectionTitle, path: sectionPath },
            ]}
            className="mb-4"
          />
          <header className="book-section-header">
            <p className="page-eyebrow">
              第{chapterNum}章　{chapterTitle}
            </p>
            <h1 className="article-title">{sectionTitle}</h1>
          </header>

          <article className="prose max-w-none">
            {llm ? (
              <Message
                variant="info"
                title="この節は LLM を活用して執筆しています"
              >
                <p>
                  本節の本文は LLM（大規模言語モデル）を活用して執筆しています。
                  技術的な内容は執筆者が検証していますが、誤りに気付かれた際は
                  リポジトリの Issue
                  やプルリクエストでご指摘いただけると助かります。
                </p>
                {coAuthors.length > 0 ? (
                  <p>
                    <strong>執筆に使用したモデル:</strong>{" "}
                    {coAuthors.join(" / ")}
                  </p>
                ) : null}
              </Message>
            ) : null}
            {content}
          </article>

          {/* 前後節ナビ。記事ページと同じく、上に墨の罫を引いた左右二つのリンクにする。 */}
          {prev || next ? (
            <nav className="article-pager" aria-label="前後の節">
              {prev ? (
                <a
                  href={toLocalePath(
                    `/books/${bookSlug}/${prev.chapter}/${prev.section}`,
                    locale
                  )}
                  rel="prev"
                  className="article-pager-link"
                >
                  <span className="article-pager-label">前の節</span>
                  <span className="article-pager-title">{prev.title}</span>
                </a>
              ) : (
                <span />
              )}
              {next ? (
                <a
                  href={toLocalePath(
                    `/books/${bookSlug}/${next.chapter}/${next.section}`,
                    locale
                  )}
                  rel="next"
                  className="article-pager-link is-next"
                >
                  <span className="article-pager-label">次の節</span>
                  <span className="article-pager-title">{next.title}</span>
                </a>
              ) : null}
            </nav>
          ) : null}
        </main>

        {/* 右: 節内 ToC */}
        <aside className="hidden w-56 shrink-0 pt-6 pb-10 lg:block">
          <Toc headings={headings} />
        </aside>
      </div>
    </SiteLayout>
  );
}
