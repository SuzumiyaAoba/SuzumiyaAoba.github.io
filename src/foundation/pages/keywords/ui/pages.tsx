import { readFile } from "node:fs/promises";
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
import { keywordSources, keywordSpecificSources } from "../model/sources";
import { keywordNotes } from "../model/notes";
import { KeywordVisual } from "./keyword-visual";
import { KeywordAnimation } from "./keyword-animation";

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
                      ? "比較デモを見る →"
                      : "Explore the demo →"}
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
  const next = subcategory.keywords[index + 1];
  const source = keywordSpecificSources[slug] ?? keywordSources[subcategoryId];
  const note = keywordNotes[slug];
  let mdxContent: Awaited<ReturnType<typeof renderMdx>> | undefined;
  if (keyword.contentPath) {
    const directory = path.join(
      process.cwd(),
      "content/keywords",
      keyword.contentPath
    );
    const filename = locale === "ja" ? "index.mdx" : "index.en.mdx";
    const { content } = matter(
      await readFile(path.join(directory, filename), "utf-8")
    );
    const scope = await loadMdxScope(content, directory);
    mdxContent = await renderMdx(content, {
      basePath: `/contents/keywords/${keyword.contentPath}`,
      scope,
    });
  }
  return (
    <SiteLayout locale={locale} path={toLocalePath(detailPath, locale)}>
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbs} />
        <header className="page-heading">
          <p className="page-count">
            {locale === "ja" ? subcategory.name : subcategory.english} ·{" "}
            {index + 1} / {subcategory.keywords.length}
          </p>
          <h1 className="page-title">
            {locale === "ja" ? keyword.name : keyword.english}
          </h1>
          <p className="text-lg leading-relaxed" lang="ja">
            {asSentence(keyword.effect)}
          </p>
        </header>
        <section aria-labelledby="animation-heading" className="space-y-4">
          <h2 id="animation-heading" className="text-xl font-semibold">
            {locale === "ja" ? "動くデモで比較する" : "Compare in motion"}
          </h2>
          <KeywordAnimation keyword={keyword} locale={locale} />
        </section>
        <section aria-labelledby="visual-heading" className="space-y-4">
          <h2 id="visual-heading" className="text-xl font-semibold">
            {locale === "ja" ? "技法のしくみ" : "How it works"}
          </h2>
          <KeywordVisual keyword={keyword} locale={locale} />
        </section>
        {mdxContent && (
          <article className="prose max-w-none min-w-0 font-serif">
            {mdxContent}
          </article>
        )}
        {note && (
          <aside
            className="max-w-3xl rounded-xl border border-border bg-muted/30 p-5 text-sm leading-relaxed"
            lang="ja"
          >
            {note}
          </aside>
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
            ← {locale === "ja" ? "サブカテゴリへ戻る" : "Back to subcategory"}
          </Link>
          {next && (
            <Link
              href={toLocalePath(
                keywordPath(categoryId, subcategoryId, next.slug),
                locale
              )}
              className="underline underline-offset-4"
            >
              {locale === "ja" ? "次" : "Next"}:{" "}
              {locale === "ja" ? next.name : next.english} →
            </Link>
          )}
        </nav>
      </main>
    </SiteLayout>
  );
}
