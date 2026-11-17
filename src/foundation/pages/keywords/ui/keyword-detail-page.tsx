import {
  notFound,
  buildBreadcrumbList,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { SiteLayout } from "@/widgets/site-layout";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import {
  getKeyword,
  getKeywordCategory,
  getKeywordSubcategory,
} from "../model/catalog";
import { keywordBreadcrumbs, keywordPath } from "./keyword-paths";
import { keywordSources, keywordSpecificSources } from "../model/sources";
import { KeywordDetailHeader } from "./keyword-detail-header";
import { KeywordReference } from "./keyword-reference";
import { loadKeywordArticle } from "./load-keyword-article";
import { RelatedKeywords } from "./related-keywords";
import { KeywordStage } from "./stage/keyword-stage";
import { hasDemo } from "./stage/registry";

export async function KeywordDetailPage({
  locale,
  categoryId,
  subcategoryId,
  slug,
}: {
  locale: Locale;
  categoryId: string;
  subcategoryId: string;
  slug: string;
}) {
  const category = await getKeywordCategory(categoryId);
  const subcategory = await getKeywordSubcategory(categoryId, subcategoryId);
  const keyword = await getKeyword(categoryId, subcategoryId, slug);
  if (!(category && subcategory && keyword)) {
    notFound();
  }
  const detailPath = keywordPath(categoryId, subcategoryId, slug);
  const breadcrumbs = [
    ...keywordBreadcrumbs(locale),
    {
      name: locale === "ja" ? category.name : category.english,
      path: keywordPath(categoryId),
    },
    {
      name: locale === "ja" ? subcategory.name : subcategory.english,
      path: keywordPath(categoryId, subcategoryId),
    },
    {
      name: locale === "ja" ? keyword.name : keyword.english,
      path: detailPath,
    },
  ];
  const index = subcategory.keywords.findIndex((item) => item.slug === slug);
  const previous = index > 0 ? subcategory.keywords[index - 1] : undefined;
  const next = subcategory.keywords[index + 1];
  const source = keywordSpecificSources[slug] ?? keywordSources[subcategoryId];
  const { mdxContent, related } = await loadKeywordArticle(keyword, locale);
  const showDemo = keyword.demoKey !== undefined && hasDemo(keyword.demoKey);
  const displayName = locale === "ja" ? keyword.name : keyword.english;
  return (
    <SiteLayout locale={locale} path={toLocalePath(detailPath, locale)}>
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbs} />
        <KeywordDetailHeader
          locale={locale}
          subcategory={subcategory}
          displayName={displayName}
          keyword={keyword}
          index={index}
        />
        {showDemo && keyword.demoKey && (
          <section aria-labelledby="demo-heading" className="space-y-4">
            <h2 id="demo-heading" className="sr-only">
              {locale === "ja" ? "インタラクティブデモ" : "Interactive demo"}
            </h2>
            <KeywordStage
              demoKey={keyword.demoKey}
              title={displayName}
              locale={locale}
            />
          </section>
        )}
        {mdxContent && (
          <article
            className="prose max-w-3xl min-w-0"
            lang={locale === "en" ? "ja" : undefined}
          >
            {locale === "en" && keyword.categoryId !== "programming" && (
              <p className="text-sm text-muted-foreground">
                This explanation is currently available in Japanese.
              </p>
            )}
            {mdxContent}
          </article>
        )}
        {related.length > 0 && (
          <RelatedKeywords locale={locale} related={related} />
        )}
        {source && (
          <KeywordReference locale={locale} source={source} slug={slug} />
        )}
        <nav
          aria-label={
            locale === "ja" ? "キーワードの移動" : "Keyword navigation"
          }
          className="keyword-pager"
        >
          <a
            href={toLocalePath(keywordPath(categoryId, subcategoryId), locale)}
            className="arrow-link"
          >
            ↑ {locale === "ja" ? "一覧へ戻る" : "Back to list"}
          </a>
          {previous && (
            <a
              href={toLocalePath(
                keywordPath(categoryId, subcategoryId, previous.slug),
                locale
              )}
              className="arrow-link"
            >
              ← {locale === "ja" ? previous.name : previous.english}
            </a>
          )}
          {next && (
            <a
              href={toLocalePath(
                keywordPath(categoryId, subcategoryId, next.slug),
                locale
              )}
              className="arrow-link"
            >
              {locale === "ja" ? next.name : next.english} →
            </a>
          )}
        </nav>
      </main>
    </SiteLayout>
  );
}
