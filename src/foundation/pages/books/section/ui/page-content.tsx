import type { ReactElement } from "react";
import { SiteLayout } from "@/widgets/site-layout";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import { buildBreadcrumbList, toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { Icon } from "@/shared/ui/icon";
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
          <header className="mb-6 space-y-1">
            <p className="text-xs text-muted-foreground">
              第{chapterNum}章 — {chapterTitle}
            </p>
            <h1 className="text-2xl font-semibold">{sectionTitle}</h1>
          </header>

          <article className="prose max-w-none font-serif">
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

          {/* 前後節ナビ */}
          <div className="mt-8 space-y-5">
            <Separator variant="muted" />
            <nav className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {prev ? (
                <div className="flex min-w-0 flex-1">
                  <Button
                    asChild
                    variant="nav"
                    size="nav"
                    className="w-full min-w-0 flex-col items-start whitespace-normal"
                  >
                    <a
                      href={toLocalePath(
                        `/books/${bookSlug}/${prev.chapter}/${prev.section}`,
                        locale
                      )}
                      className="w-full min-w-0"
                    >
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Icon
                          icon="lucide:chevron-left"
                          className="size-3 shrink-0"
                        />
                        前の節
                      </span>
                      <span className="w-full min-w-0 text-left text-sm font-medium break-words">
                        {prev.title}
                      </span>
                    </a>
                  </Button>
                </div>
              ) : (
                <div />
              )}
              {next ? (
                <div className="flex min-w-0 flex-1 justify-end">
                  <Button
                    asChild
                    variant="nav"
                    size="nav"
                    className="w-full min-w-0 flex-col items-end whitespace-normal"
                  >
                    <a
                      href={toLocalePath(
                        `/books/${bookSlug}/${next.chapter}/${next.section}`,
                        locale
                      )}
                      className="w-full min-w-0"
                    >
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        次の節
                        <Icon
                          icon="lucide:chevron-right"
                          className="size-3 shrink-0"
                        />
                      </span>
                      <span className="w-full min-w-0 text-right text-sm font-medium break-words">
                        {next.title}
                      </span>
                    </a>
                  </Button>
                </div>
              ) : (
                <div />
              )}
            </nav>
          </div>
        </main>

        {/* 右: 節内 ToC */}
        <aside className="hidden w-56 shrink-0 pt-6 pb-10 lg:block">
          <Toc headings={headings} />
        </aside>
      </div>
    </SiteLayout>
  );
}
