import type { AwesomeItem } from "../model/awesome-item";
import Link from "next/link";
import { getAwesomeCatalog } from "../model/awesome-catalog";
import { getAwesomePath } from "../model/awesome-categories";
import { SiteLayout } from "@/widgets/site-layout";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { CategoryIcon } from "./category-icon";

export type AwesomeSomethingPageContentProps = {
  locale: Locale;
  items: AwesomeItem[];
};

export function AwesomeSomethingPageContent({
  locale,
  items,
}: AwesomeSomethingPageContentProps) {
  const path = "/awesome-something";
  const categories = getAwesomeCatalog(items);
  const isEnglish = locale === "en";
  const breadcrumbs = buildListBreadcrumbItems(locale, {
    name: "Awesome Something",
    path,
  });

  return (
    <SiteLayout locale={locale} path={toLocalePath(path, locale)}>
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbs} />
        <header className="page-heading">
          <div>
            <h1 className="page-title">Awesome Something</h1>
            {items.length > 0 && (
              <Link
                href={toLocalePath(getAwesomePath("all"), locale)}
                className="arrow-link"
              >
                {isEnglish ? "All items" : "すべての項目"}
              </Link>
            )}
          </div>
          <p className="page-count">
            {isEnglish
              ? `${categories.length} categories / ${items.length} items`
              : `${categories.length} カテゴリ / ${items.length} 件`}
          </p>
        </header>
        {items.length === 0 ? (
          <p className="empty-state">
            {isEnglish ? "No items yet." : "まだ登録がありません。"}
          </p>
        ) : (
          /* 分野ごとの段。分野名の下に、細目と件数を索引のようにリーダーでつなぐ。 */
          <div className="index-columns">
            {categories.map((category) => (
              <section
                key={category.id}
                aria-labelledby={`category-${category.id}`}
                className="index-column"
              >
                <p className="index-column-meta index-column-meta-icon">
                  <CategoryIcon category={category.id} />
                  {isEnglish
                    ? `${category.count} items`
                    : `${category.count} 件`}
                </p>
                <h2
                  id={`category-${category.id}`}
                  className="index-column-title"
                >
                  <Link
                    href={toLocalePath(getAwesomePath(category.id), locale)}
                  >
                    {category.name[locale]}
                  </Link>
                </h2>
                <nav
                  aria-label={
                    isEnglish
                      ? `${category.name.en} subcategories`
                      : `${category.name.ja}のサブカテゴリ`
                  }
                >
                  <ul className="index-column-list">
                    {category.subcategories.map((subcategory) => (
                      <li key={subcategory.id}>
                        <Link
                          href={toLocalePath(
                            getAwesomePath(category.id, subcategory.id),
                            locale
                          )}
                          className="leader-link"
                        >
                          <span>{subcategory.name[locale]}</span>
                          <span>{subcategory.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </section>
            ))}
          </div>
        )}
      </main>
    </SiteLayout>
  );
}
