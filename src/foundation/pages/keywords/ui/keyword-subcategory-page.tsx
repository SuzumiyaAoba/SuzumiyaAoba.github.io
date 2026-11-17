import {
  notFound,
  buildBreadcrumbList,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { SiteLayout } from "@/widgets/site-layout";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { getKeywordCategory, getKeywordSubcategory } from "../model/catalog";
import { keywordBreadcrumbs, keywordPath } from "./keyword-paths";

export async function KeywordSubcategoryPage({
  locale,
  categoryId,
  subcategoryId,
}: {
  locale: Locale;
  categoryId: string;
  subcategoryId: string;
}) {
  const category = await getKeywordCategory(categoryId);
  const subcategory = await getKeywordSubcategory(categoryId, subcategoryId);
  if (!(category && subcategory)) {
    notFound();
  }
  const subcategoryPath = keywordPath(categoryId, subcategoryId);
  const breadcrumbs = [
    ...keywordBreadcrumbs(locale),
    {
      name: locale === "ja" ? category.name : category.english,
      path: keywordPath(categoryId),
    },
    {
      name: locale === "ja" ? subcategory.name : subcategory.english,
      path: subcategoryPath,
    },
  ];
  return (
    <SiteLayout locale={locale} path={toLocalePath(subcategoryPath, locale)}>
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbs} />
        <header className="page-heading">
          <div>
            <h1 className="page-title">
              {locale === "ja" ? subcategory.name : subcategory.english}
            </h1>
            <p className="page-lead">{subcategory.description}</p>
          </div>
          <p className="page-count">
            {subcategory.keywords.length}{" "}
            {locale === "ja" ? "項目" : "keywords"}
          </p>
        </header>
        {/* 用語集の見出し語のように、名前・対訳・効き目を一項目ずつ並べる。 */}
        <ol className="glossary-list">
          {subcategory.keywords.map((keyword) => (
            <li key={keyword.slug}>
              <a
                href={toLocalePath(
                  keywordPath(categoryId, subcategoryId, keyword.slug),
                  locale
                )}
                className="glossary-entry"
              >
                <span className="glossary-term">
                  {locale === "ja" ? keyword.name : keyword.english}
                </span>
                <span
                  className="glossary-gloss"
                  lang={locale === "ja" ? "en" : "ja"}
                >
                  {locale === "ja" ? keyword.english : keyword.name}
                </span>
                <span className="glossary-definition">{keyword.effect}</span>
              </a>
            </li>
          ))}
        </ol>
      </main>
    </SiteLayout>
  );
}
