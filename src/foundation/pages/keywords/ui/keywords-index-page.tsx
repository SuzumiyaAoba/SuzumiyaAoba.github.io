import { buildBreadcrumbList, toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { SiteLayout } from "@/widgets/site-layout";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { getKeywordCategories } from "../model/catalog";
import { keywordBreadcrumbs, keywordPath } from "./keyword-paths";
import { keywordRecipes } from "./keyword-recipes";

export async function KeywordsIndexPage({ locale }: { locale: Locale }) {
  const categories = await getKeywordCategories();
  const breadcrumbs = keywordBreadcrumbs(locale);
  const subcategoryCount = categories.reduce(
    (total, category) => total + category.subcategories.length,
    0
  );
  const keywordCount = categories.reduce(
    (total, category) =>
      total +
      category.subcategories.reduce(
        (count, subcategory) => count + subcategory.keywords.length,
        0
      ),
    0
  );

  return (
    <SiteLayout locale={locale} path={toLocalePath("/keywords", locale)}>
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbs} />
        <header className="page-heading">
          <h1 className="page-title">Keywords</h1>
          <p className="page-count">
            {categories.length} {locale === "ja" ? "カテゴリ" : "categories"} ·{" "}
            {subcategoryCount}{" "}
            {locale === "ja" ? "サブカテゴリ" : "subcategories"} ·{" "}
            {keywordCount} {locale === "ja" ? "項目" : "keywords"}
          </p>
        </header>
        {/* 分野ごとの段。分野名の下に、細目と項目数を索引のようにリーダーでつなぐ。 */}
        <div className="index-columns">
          {categories.map((category) => {
            const count = category.subcategories.reduce(
              (total, subcategory) => total + subcategory.keywords.length,
              0
            );
            return (
              <section key={category.id} className="index-column">
                <p className="index-column-meta">
                  {category.subcategories.length}{" "}
                  {locale === "ja" ? "サブカテゴリ" : "subcategories"} · {count}{" "}
                  {locale === "ja" ? "項目" : "items"}
                </p>
                <h2 className="index-column-title">
                  <a href={toLocalePath(keywordPath(category.id), locale)}>
                    {locale === "ja" ? category.name : category.english}
                  </a>
                </h2>
                <p className="index-column-note">{category.description}</p>
                <nav
                  aria-label={
                    locale === "ja"
                      ? `${category.name}のサブカテゴリ`
                      : `${category.english} subcategories`
                  }
                >
                  <ul className="index-column-list">
                    {category.subcategories.map((subcategory) => (
                      <li key={subcategory.id}>
                        <a
                          href={toLocalePath(
                            keywordPath(category.id, subcategory.id),
                            locale
                          )}
                          className="leader-link"
                        >
                          <span>
                            {locale === "ja"
                              ? subcategory.name
                              : subcategory.english}
                          </span>
                          <span>{subcategory.keywords.length}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </section>
            );
          })}
        </div>
        <section className="keyword-recipes" aria-labelledby="recipes-heading">
          <div className="section-heading">
            <h2 id="recipes-heading" className="section-title">
              {locale === "ja" ? "組み合わせて作る" : "Combine techniques"}
            </h2>
          </div>
          {/* 組み合わせる技法を「＋」でつなぎ、足し算として読ませる。 */}
          <ul className="recipe-list">
            {keywordRecipes.map((recipe) => (
              <li key={recipe.name}>
                <h3 className="recipe-name">
                  {locale === "ja" ? recipe.name : recipe.english}
                </h3>
                <ul className="recipe-terms">
                  {recipe.terms.map(([category, subcategory, slug, name]) => (
                    <li key={slug}>
                      <a
                        href={toLocalePath(
                          keywordPath(category, subcategory, slug),
                          locale
                        )}
                      >
                        {name}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </SiteLayout>
  );
}
