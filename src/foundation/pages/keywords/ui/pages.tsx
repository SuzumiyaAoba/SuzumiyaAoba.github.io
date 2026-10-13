import { access, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteLayout } from "@/widgets/site-layout";
import { loadMdxScope, renderMdx } from "@/shared/lib/mdx";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import {
  getKeyword,
  getKeywordCategories,
  getKeywordCategory,
  getKeywordSubcategory,
} from "../model/catalog";
import type { Keyword } from "../model/catalog";
import { keywordSources, keywordSpecificSources } from "../model/sources";
import { KeywordStage } from "./stage/keyword-stage";
import { hasDemo } from "./stage/registry";

const keywordPath = (category: string, subcategory?: string, slug?: string) =>
  `/keywords/${category}${subcategory ? `/${subcategory}` : ""}${slug ? `/${slug}` : ""}`;

const recipes = [
  {
    name: "曲がって飛ぶレーザー",
    english: "Curved laser",
    terms: [
      ["simulation", "curves", "cubic-hermite-curve", "エルミート曲線"],
      [
        "simulation",
        "curves",
        "arc-length-parameterization",
        "弧長パラメータ化",
      ],
      ["graphics", "particles", "ribbon", "リボン・トレイル"],
      ["graphics", "post", "bloom", "ブルーム"],
    ],
  },
  {
    name: "渦巻く煙",
    english: "Swirling smoke",
    terms: [
      ["graphics", "noise", "curl-noise", "カールノイズ"],
      [
        "simulation",
        "fluids",
        "semi-lagrangian-advection",
        "半ラグランジュ移流",
      ],
      ["graphics", "particles", "soft-particles", "ソフトパーティクル"],
    ],
  },
  {
    name: "融合するスライム",
    english: "Merging slime",
    terms: [
      ["graphics", "fields", "signed-distance-field", "符号付き距離場"],
      ["graphics", "fields", "smooth-union", "スムーズユニオン"],
      ["graphics", "lighting", "fresnel", "フレネル"],
    ],
  },
  {
    name: "自然に散らばる森林",
    english: "Natural forest",
    terms: [
      ["world", "sampling", "poisson-disk-sampling", "ポアソンディスク分布"],
      ["world", "generation", "density-masked-scattering", "密度マスク散布"],
      [
        "implementation",
        "performance",
        "gpu-instancing",
        "GPUインスタンシング",
      ],
    ],
  },
] as const;

const keywordBreadcrumbs = (locale: Locale) =>
  buildListBreadcrumbItems(locale, { name: "Keywords", path: "/keywords" });

const fileExists = async (file: string) => {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
};

/** frontmatter の related（"subcategory/slug" の配列）をキーワードに解決する。 */
const resolveRelated = async (value: unknown): Promise<Keyword[]> => {
  if (!Array.isArray(value)) {
    return [];
  }
  const keywords = (await getKeywordCategories()).flatMap((category) =>
    category.subcategories.flatMap((subcategory) => subcategory.keywords)
  );
  return value.flatMap((entry) => {
    if (typeof entry !== "string") {
      return [];
    }
    const found = keywords.find(
      (keyword) => `${keyword.subcategoryId}/${keyword.slug}` === entry
    );
    if (!found) {
      throw new Error(`Unknown related keyword: ${entry}`);
    }
    return [found];
  });
};

const asSentence = (value: string) =>
  /[。.!?]$/u.test(value) ? value : `${value}。`;

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
                  <Link href={toLocalePath(keywordPath(category.id), locale)}>
                    {locale === "ja" ? category.name : category.english}
                  </Link>
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
                        <Link
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
                        </Link>
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
            {recipes.map((recipe) => (
              <li key={recipe.name}>
                <h3 className="recipe-name">
                  {locale === "ja" ? recipe.name : recipe.english}
                </h3>
                <ul className="recipe-terms">
                  {recipe.terms.map(([category, subcategory, slug, name]) => (
                    <li key={slug}>
                      <Link
                        href={toLocalePath(
                          keywordPath(category, subcategory, slug),
                          locale
                        )}
                      >
                        {name}
                      </Link>
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
              <Link
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
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </SiteLayout>
  );
}

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
              <Link
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
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </SiteLayout>
  );
}

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
  let mdxContent: Awaited<ReturnType<typeof renderMdx>> | undefined;
  let related: Keyword[] = [];
  if (keyword.contentPath) {
    const directory = path.join(
      process.cwd(),
      "content/keywords",
      keyword.contentPath
    );
    const localized = path.join(directory, "index.en.mdx");
    const useEnglish = locale === "en" && (await fileExists(localized));
    const { content, data } = matter(
      await readFile(
        useEnglish ? localized : path.join(directory, "index.mdx"),
        "utf-8"
      )
    );
    const scope = await loadMdxScope(content, directory);
    mdxContent = await renderMdx(content, {
      basePath: `/contents/keywords/${keyword.contentPath}`,
      scope,
    });
    related = await resolveRelated(data["related"]);
  }
  const showDemo = keyword.demoKey !== undefined && hasDemo(keyword.demoKey);
  const displayName = locale === "ja" ? keyword.name : keyword.english;
  return (
    <SiteLayout locale={locale} path={toLocalePath(detailPath, locale)}>
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbs} />
        <header className="page-heading">
          <div>
            <p className="page-eyebrow">
              {locale === "ja" ? subcategory.name : subcategory.english}
            </p>
            <div className="keyword-title">
              <h1 className="page-title">{displayName}</h1>
              <p
                className="keyword-title-gloss"
                lang={locale === "ja" ? "en" : "ja"}
              >
                {locale === "ja" ? keyword.english : keyword.name}
              </p>
            </div>
            <p className="keyword-effect" lang="ja">
              {asSentence(keyword.effect)}
            </p>
          </div>
          <p className="page-count">
            {index + 1} / {subcategory.keywords.length}
          </p>
        </header>
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
          <section aria-labelledby="related-heading">
            <div className="section-heading">
              <h2 id="related-heading" className="section-title">
                {locale === "ja" ? "関連キーワード" : "Related keywords"}
              </h2>
            </div>
            <ul className="glossary-list">
              {related.map((item) => (
                <li key={`${item.subcategoryId}/${item.slug}`}>
                  <Link
                    href={toLocalePath(
                      keywordPath(
                        item.categoryId,
                        item.subcategoryId,
                        item.slug
                      ),
                      locale
                    )}
                    className="glossary-entry"
                  >
                    <span className="glossary-term">
                      {locale === "ja" ? item.name : item.english}
                    </span>
                    <span
                      className="glossary-gloss"
                      lang={locale === "ja" ? "en" : "ja"}
                    >
                      {locale === "ja" ? item.english : item.name}
                    </span>
                    <span className="glossary-definition">{item.effect}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {source && (
          <section aria-labelledby="source-heading" className="space-y-2">
            <div className="section-heading">
              <h2 id="source-heading" className="section-title">
                {locale === "ja" ? "参考資料" : "References"}
              </h2>
            </div>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="arrow-link"
            >
              {source.title} ↗
            </a>
            {keywordSpecificSources[slug] ? null : (
              <p className="text-xs text-muted-foreground">
                {locale === "ja"
                  ? "分野全体の資料で、この項目を直接扱っているとは限りません。"
                  : "A general reference for this subcategory."}
              </p>
            )}
          </section>
        )}
        <nav
          aria-label={
            locale === "ja" ? "キーワードの移動" : "Keyword navigation"
          }
          className="keyword-pager"
        >
          <Link
            href={toLocalePath(keywordPath(categoryId, subcategoryId), locale)}
            className="arrow-link"
          >
            ↑ {locale === "ja" ? "一覧へ戻る" : "Back to list"}
          </Link>
          {previous && (
            <Link
              href={toLocalePath(
                keywordPath(categoryId, subcategoryId, previous.slug),
                locale
              )}
              className="arrow-link"
            >
              ← {locale === "ja" ? previous.name : previous.english}
            </Link>
          )}
          {next && (
            <Link
              href={toLocalePath(
                keywordPath(categoryId, subcategoryId, next.slug),
                locale
              )}
              className="arrow-link"
            >
              {locale === "ja" ? next.name : next.english} →
            </Link>
          )}
        </nav>
      </main>
    </SiteLayout>
  );
}
