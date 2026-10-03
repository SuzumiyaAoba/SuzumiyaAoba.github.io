import type { ReactElement } from "react";

import { SiteLayout } from "@/widgets/site-layout";
import type { AffiliateProduct } from "@/shared/lib/affiliate-products";
import {
  buildBreadcrumbList,
  buildDetailBreadcrumbItems,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { AmazonAssociate, AmazonProductSection } from "@/shared/ui/amazon";
import { I18nText } from "@/shared/ui/i18n-text";
import { Message } from "@/shared/ui/mdx";
import { JsonLd } from "@/shared/ui/seo";
import { formatDate, toIntlLocaleTag } from "@/shared/lib/presentation";

export type NotesDetailPageContentProps = {
  locale: Locale;
  noteTitle: string;
  notePath: string;
  noteDate?: string;
  category?: string;
  tags: string[];
  isEn: boolean;
  translationModel?: string;
  originalPath: string;
  content: ReactElement;
  amazonProducts: AffiliateProduct[];
  shouldShowAmazonAssociate: boolean;
};

export function NotesDetailPageContent({
  locale,
  noteTitle,
  notePath,
  noteDate,
  category,
  tags,
  isEn,
  translationModel,
  originalPath,
  content,
  amazonProducts,
  shouldShowAmazonAssociate,
}: NotesDetailPageContentProps) {
  const breadcrumbItems = buildDetailBreadcrumbItems(
    locale,
    { name: "Notes", path: "/notes" },
    { name: noteTitle, path: notePath }
  );

  return (
    <SiteLayout locale={locale} path={notePath}>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="article-page">
        <article>
          <header className="article-header reading-column">
            <p className="article-kicker">
              <a href={toLocalePath("/keywords", locale)}>
                <I18nText locale={locale} ja="キーワード" en="Keywords" />
              </a>
              {category ? <span>{category}</span> : null}
            </p>
            <h1 className="article-title">{noteTitle}</h1>
            {noteDate ? (
              <div className="article-meta">
                <time dateTime={noteDate}>
                  {formatDate(noteDate, toIntlLocaleTag(locale))}
                </time>
              </div>
            ) : null}
            {tags.length > 0 ? (
              <ul
                className="tag-list"
                aria-label={locale === "en" ? "Tags" : "タグ"}
              >
                {tags.map((tag) => (
                  <li key={`${locale}-${tag}`}>
                    <a
                      href={toLocalePath(
                        `/tags/${encodeURIComponent(tag)}`,
                        locale
                      )}
                    >
                      #{tag}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </header>

          <div className="reading-column">
            <div className="prose">
              {isEn && translationModel ? (
                <Message title="Translation" variant="info" defaultOpen>
                  This note was translated by {translationModel}. The original
                  is{" "}
                  <a href={originalPath}>read the original Japanese article</a>.
                </Message>
              ) : null}
              {content}
            </div>

            {amazonProducts.length > 0 ? (
              <AmazonProductSection
                products={amazonProducts}
                className="mt-12"
              />
            ) : null}
            {shouldShowAmazonAssociate ? (
              <div className="mt-6">
                <AmazonAssociate />
              </div>
            ) : null}

            <footer className="article-footer">
              <a
                href={toLocalePath("/keywords", locale)}
                className="arrow-link"
              >
                <span aria-hidden="true">←</span>
                <I18nText
                  locale={locale}
                  ja="キーワードの一覧へ"
                  en="All keywords"
                />
              </a>
            </footer>
          </div>
        </article>
      </main>
    </SiteLayout>
  );
}
