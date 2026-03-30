import type { ReactElement } from "react";

import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList, toLocalePath, type Locale } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { Card } from "@/shared/ui/card";
import { Tag } from "@/shared/ui/tag";
import { AmazonAssociate, AmazonProductSection } from "@/shared/ui/amazon";
import type { AffiliateProduct } from "@/shared/lib/affiliate-products";

export type NoteEntry = {
  slug: string;
  title: string;
  date?: string;
  category?: string;
  tags: string[];
  content: ReactElement;
  amazonProducts: AffiliateProduct[];
  shouldShowAmazonAssociate: boolean;
};

export type NotesIndexPageContentProps = {
  locale: Locale;
  notes: NoteEntry[];
};

export function NotesIndexPageContent({ locale, notes }: NotesIndexPageContentProps) {
  const pagePath = toLocalePath("/notes", locale);
  const shouldShowAmazonAssociate = notes.some((note) => note.shouldShowAmazonAssociate);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Notes", path: pagePath },
        ])}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={locale} ja="ノート" en="Notes" />
          </h1>
          <div className="max-w-3xl space-y-3">
            <p className="text-sm leading-7 text-muted-foreground">
              <I18nText
                locale={locale}
                ja="読書メモ、設計原則、開発中に残した短い知見をまとめています。"
                en="A collection of short notes on reading, design principles, and things learned while building."
              />
            </p>
            {notes.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {notes.map((note) => (
                  <a
                    key={note.slug}
                    href={`#${note.slug}`}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {note.title}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {notes.length > 0 ? (
          <div className="space-y-6">
            {notes.map((note, index) => (
              <div key={note.slug} className="space-y-6">
                <Card
                  id={note.slug}
                  className="scroll-mt-24 border-transparent bg-card/50 shadow-none"
                >
                  <article className="px-5 py-6 sm:px-6 sm:py-7">
                    <header className="mb-6 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-2">
                          {note.date ? (
                            <p className="text-xs text-muted-foreground">{note.date}</p>
                          ) : null}
                          <h2 className="text-2xl font-semibold break-words">
                            <a
                              href={`#${note.slug}`}
                              className="transition-colors hover:text-foreground/80"
                            >
                              {note.title}
                            </a>
                          </h2>
                        </div>
                        <a
                          href={`#${note.slug}`}
                          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={`${note.title} anchor`}
                        >
                          #{note.slug}
                        </a>
                      </div>

                      {note.category || note.tags.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {note.category ? (
                            <span className="rounded-full border border-border/40 px-2.5 py-1 text-[11px] font-medium">
                              {note.category}
                            </span>
                          ) : null}
                          {note.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {note.tags.map((tag) => (
                                <Tag
                                  key={tag}
                                  tag={tag}
                                  href={toLocalePath(`/tags/${encodeURIComponent(tag)}`, locale)}
                                  className="bg-muted text-[11px] font-medium text-muted-foreground"
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </header>

                    <div className="prose prose-neutral max-w-none min-w-0 font-sans">
                      {note.content}
                    </div>

                    {note.amazonProducts.length > 0 ? (
                      <div className="mt-8">
                        <AmazonProductSection products={note.amazonProducts} />
                      </div>
                    ) : null}
                  </article>
                </Card>

                {index < notes.length - 1 ? <hr className="border-border/40" /> : null}
              </div>
            ))}

            {shouldShowAmazonAssociate ? (
              <div className="pt-2">
                <AmazonAssociate />
              </div>
            ) : null}
          </div>
        ) : (
          <Card className="border-transparent bg-card/40 shadow-none">
            <div className="px-5 py-6 text-sm text-muted-foreground">
              <I18nText
                locale={locale}
                ja="まだノートがありません。"
                en="No notes have been published yet."
              />
            </div>
          </Card>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
