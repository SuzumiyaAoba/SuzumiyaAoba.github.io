import { notFound } from "next/navigation";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getSeriesBySlug } from "@/entities/series-item";
import { getBlogPost } from "@/entities/blog";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";

type PageProps = {
  params: Promise<{ series: string }>;
  locale?: Locale;
};

export default async function Page({ params, locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const { series: slug } = await params;
  const series = await getSeriesBySlug(slug, resolvedLocale);

  if (!series) {
    notFound();
  }

  const [postsJa, postsEn] = await Promise.all([
    Promise.all(
      series.posts.map((postSlug) => getBlogPost(postSlug, { locale: "ja", fallback: false })),
    ),
    Promise.all(
      series.posts.map((postSlug) => getBlogPost(postSlug, { locale: "en", fallback: false })),
    ),
  ]);
  const entriesJa = postsJa
    .filter((post): post is NonNullable<typeof post> => Boolean(post))
    .map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title || post.slug,
      date: post.frontmatter.date,
      tags: post.frontmatter.tags ?? [],
    }));
  const entriesEn = postsEn
    .filter((post): post is NonNullable<typeof post> => Boolean(post))
    .map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title || post.slug,
      date: post.frontmatter.date,
      tags: post.frontmatter.tags ?? [],
    }));
  const entries = resolvedLocale === "en" ? entriesEn : entriesJa;
  const pagePath = toLocalePath(`/series/${series.slug}`, resolvedLocale);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: "Series", path: toLocalePath("/series", resolvedLocale) },
          { name: series.name, path: pagePath },
        ])}
      />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <Breadcrumbs
          items={[
            { name: "Home", path: toLocalePath("/", resolvedLocale) },
            { name: "Series", path: toLocalePath("/series", resolvedLocale) },
            { name: series.name, path: pagePath },
          ]}
          className="mb-2"
        />
        <section className="space-y-3">
          <a
            href={toLocalePath("/series", resolvedLocale)}
            className="text-xs font-medium text-muted-foreground"
          >
            <I18nText locale={resolvedLocale} ja="← シリーズ一覧" en="← Back to series" />
          </a>
          <h1 className="text-3xl font-semibold">{series.name}</h1>
          {series.description ? (
            <p className="text-sm leading-6 text-muted-foreground">{series.description}</p>
          ) : null}
        </section>

        {entriesJa.length === 0 && entriesEn.length === 0 ? (
          <Card className="border-transparent bg-card/40 shadow-none">
            <div className="px-5 py-6 text-sm text-muted-foreground">
              <I18nText locale={resolvedLocale} ja="まだ記事がありません。" en="No posts yet." />
            </div>
          </Card>
        ) : (
          <ul className="space-y-4">
            {entries.map((post) => (
              <li key={`${resolvedLocale}-${post.slug}`}>
                <Card className="group relative border-transparent bg-card/40 shadow-none transition-colors hover:bg-muted/20">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-1 rounded-[18px] bg-muted/30 opacity-0 transition duration-200 ease-out scale-95 group-hover:opacity-100 group-hover:scale-100"
                  />
                  <a
                    href={toLocalePath(`/blog/post/${post.slug}`, resolvedLocale)}
                    className="relative z-10 flex flex-col gap-3 px-5 py-5"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{post.date}</span>
                      <Badge
                        variant="secondary"
                        className="bg-muted/70 text-[11px] text-muted-foreground"
                      >
                        {series.name}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-foreground">{post.title}</p>
                      {post.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <Tag
                              key={`${resolvedLocale}-${tag}`}
                              tag={tag}
                              className="bg-muted text-[11px] font-medium text-muted-foreground"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </a>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
