import {
  notFound,
  buildBreadcrumbList,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { SiteLayout } from "@/widgets/site-layout";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { getKeywordCategory } from "../model/catalog";
import { keywordBreadcrumbs, keywordPath } from "./keyword-paths";

export async function KeywordCategoryPage({
  locale,
  id,
}: {
  locale: Locale;
  id: string;
}) {
  const category = await getKeywordCategory(id);
  if (!category) {
    notFound();
  }
  const categoryPath = keywordPath(id);
  const breadcrumbs = [
    ...keywordBreadcrumbs(locale),
    {
      name: locale === "ja" ? category.name : category.english,
      path: categoryPath,
    },
  ];
  return (
    <SiteLayout locale={locale} path={toLocalePath(categoryPath, locale)}>
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbs} />
        <header className="page-heading">
          <div>
            <h1 className="page-title">
              {locale === "ja" ? category.name : category.english}
            </h1>
            <p className="page-lead">{category.description}</p>
          </div>
          <p className="page-count">
            {category.subcategories.length}{" "}
            {locale === "ja" ? "サブカテゴリ" : "subcategories"}
          </p>
        </header>
        <ul className="collection-card-list">
          {category.subcategories.map((subcategory) => (
            <li key={subcategory.id}>
              <a
                href={toLocalePath(keywordPath(id, subcategory.id), locale)}
                className="collection-card-link"
              >
                <h2 className="collection-card-title">
                  {locale === "ja" ? subcategory.name : subcategory.english}
                </h2>
                <p className="collection-card-description">
                  {subcategory.description}
                </p>
                <p className="collection-card-footer">
                  <span className="collection-card-meta">
                    {subcategory.keywords.length}{" "}
                    {locale === "ja" ? "項目" : "items"}
                  </span>
                </p>
              </a>
            </li>
          ))}
        </ul>
      </main>
    </SiteLayout>
  );
}
