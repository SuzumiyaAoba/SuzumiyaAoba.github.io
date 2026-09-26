import { access, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { ArrowRight } from "lucide-react";
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
          <p className="text-muted-foreground">
            {locale === "ja"
              ? "ゲームでどう使う？ すべての用語を、動くデモと使いどころから学ぶ。"
              : "See every technique in action. Explore interactive demos and game use cases."}
          </p>
          <p className="page-count">
            {categories.length} {locale === "ja" ? "カテゴリ" : "categories"} ·{" "}
            {subcategoryCount}{" "}
            {locale === "ja" ? "サブカテゴリ" : "subcategories"} ·{" "}
            {keywordCount} {locale === "ja" ? "項目" : "keywords"}
          </p>
        </header>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const count = category.subcategories.reduce(
              (total, subcategory) => total + subcategory.keywords.length,
              0
            );
            return (
              <section
                key={category.id}
                className="flex min-w-0 flex-col rounded-xl border border-border bg-card"
              >
                <Link
                  href={toLocalePath(keywordPath(category.id), locale)}
                  className="group block rounded-t-xl p-6 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div className="mb-5 text-xs text-muted-foreground tabular-nums">
                    {category.subcategories.length}{" "}
                    {locale === "ja" ? "サブカテゴリ" : "subcategories"} ·{" "}
                    {count} {locale === "ja" ? "項目" : "items"}
                  </div>
                  <h2 className="flex items-center justify-between gap-3 text-lg font-semibold tracking-tight">
                    {locale === "ja" ? category.name : category.english}
                    <ArrowRight
                      className="size-4 shrink-0 text-muted-foreground transition-transform motion-safe:group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </Link>
                <nav
                  aria-label={
                    locale === "ja"
                      ? `${category.name}のサブカテゴリ`
                      : `${category.english} subcategories`
                  }
                  className="mx-6 mb-5 border-t border-border pt-3"
                >
                  <ul>
                    {category.subcategories.map((subcategory) => (
                      <li key={subcategory.id}>
                        <Link
                          href={toLocalePath(
                            keywordPath(category.id, subcategory.id),
                            locale
                          )}
                          className="flex min-h-11 items-center justify-between gap-3 rounded-sm py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        >
                          <span>
                            {locale === "ja"
                              ? subcategory.name
                              : subcategory.english}
                          </span>
                          <span className="text-xs tabular-nums">
                            {subcategory.keywords.length}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </section>
            );
          })}
        </div>
        <section className="space-y-5" aria-labelledby="recipes-heading">
          <h2 id="recipes-heading" className="text-xl font-semibold">
            {locale === "ja" ? "組み合わせて作る" : "Combine techniques"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {recipes.map((recipe) => (
              <div
                key={recipe.name}
                className="rounded-xl border border-border bg-card p-5"
              >
                <h3 className="font-semibold">
                  {locale === "ja" ? recipe.name : recipe.english}
                </h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {recipe.terms.map(([category, subcategory, slug, name]) => (
                    <li key={slug}>
                      <Link
                        href={toLocalePath(
                          keywordPath(category, subcategory, slug),
                          locale
                        )}
                        className="inline-flex min-h-9 items-center rounded-md border border-border px-3 text-xs transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
          <h1 className="page-title">
            {locale === "ja" ? category.name : category.english}
          </h1>
          <p className="text-muted-foreground">{category.description}</p>
        </header>
        <div className="grid gap-5 md:grid-cols-2">
          {category.subcategories.map((subcategory) => (
            <Link
              key={subcategory.id}
              href={toLocalePath(keywordPath(id, subcategory.id), locale)}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-foreground/30 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <p className="text-xs text-muted-foreground">
                {subcategory.keywords.length}{" "}
                {locale === "ja" ? "項目" : "items"}
              </p>
              <h2 className="mt-3 flex items-center justify-between gap-3 text-lg font-semibold">
                {locale === "ja" ? subcategory.name : subcategory.english}
                <ArrowRight
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {subcategory.description}
              </p>
            </Link>
          ))}
        </div>
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
          <h1 className="page-title">
            {locale === "ja" ? subcategory.name : subcategory.english}
          </h1>
          <p className="text-muted-foreground">{subcategory.description}</p>
          <p className="page-count">
            {subcategory.keywords.length}{" "}
            {locale === "ja" ? "項目" : "keywords"}
          </p>
        </header>
        <ol className="grid gap-3 md:grid-cols-2">
          {subcategory.keywords.map((keyword) => (
            <li key={keyword.slug}>
              <Link
                href={toLocalePath(
                  keywordPath(categoryId, subcategoryId, keyword.slug),
                  locale
                )}
                className="group flex h-full items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {locale === "ja" ? keyword.name : keyword.english}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {locale === "ja" ? keyword.english : keyword.name}
                  </span>
                  <span className="mt-3 block text-sm text-muted-foreground">
                    {keyword.effect}
                  </span>
                  <span className="mt-3 block text-xs font-medium text-brand">
                    {locale === "ja"
                      ? "3D デモと解説を見る →"
                      : "Explore the 3D demo →"}
                  </span>
                </span>
                <ArrowRight
                  className="mt-1 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
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
        <header className="space-y-3 border-b border-border pb-6">
          <p className="page-count">
            {locale === "ja" ? subcategory.name : subcategory.english} ·{" "}
            {index + 1} / {subcategory.keywords.length}
          </p>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="page-title">{displayName}</h1>
            <p className="font-mono text-sm text-muted-foreground">
              {locale === "ja" ? keyword.english : keyword.name}
            </p>
          </div>
          <p className="max-w-3xl text-lg leading-relaxed" lang="ja">
            {asSentence(keyword.effect)}
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
          <section aria-labelledby="related-heading" className="space-y-4">
            <h2 id="related-heading" className="text-xl font-semibold">
              {locale === "ja" ? "関連キーワード" : "Related keywords"}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    className="flex h-full flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="font-semibold">
                      {locale === "ja" ? item.name : item.english}
                    </span>
                    <span className="mt-1 text-sm text-muted-foreground">
                      {item.effect}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {source && (
          <section aria-labelledby="source-heading" className="space-y-2">
            <h2 id="source-heading" className="text-xl font-semibold">
              {locale === "ja" ? "さらに調べる" : "Further reading"}
            </h2>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline underline-offset-4"
            >
              {source.title} ↗
            </a>
            <p className="text-xs text-muted-foreground">
              {keywordSpecificSources[slug]
                ? locale === "ja"
                  ? "この項目の参考資料です。"
                  : "A reference for this term."
                : locale === "ja"
                  ? "この分野の参考資料です。個々の項目を直接説明する資料とは限りません。"
                  : "A general reference for this subcategory."}
            </p>
          </section>
        )}
        <nav
          aria-label={
            locale === "ja" ? "キーワードの移動" : "Keyword navigation"
          }
          className="flex flex-wrap gap-4 border-t border-border pt-5 text-sm"
        >
          <Link
            href={toLocalePath(keywordPath(categoryId, subcategoryId), locale)}
            className="underline underline-offset-4"
          >
            ↑ {locale === "ja" ? "一覧へ戻る" : "Back to list"}
          </Link>
          {previous && (
            <Link
              href={toLocalePath(
                keywordPath(categoryId, subcategoryId, previous.slug),
                locale
              )}
              className="underline underline-offset-4"
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
              className="underline underline-offset-4"
            >
              {locale === "ja" ? next.name : next.english} →
            </Link>
          )}
        </nav>
      </main>
    </SiteLayout>
  );
}
