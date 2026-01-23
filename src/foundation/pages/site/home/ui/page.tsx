import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getBlogPostsVariants } from "@/entities/blog";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { BlogPostList } from "@/entities/blog";
import { PostActivityHeatmap } from "./post-activity-heatmap";

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const posts = await getBlogPostsVariants();
  const latestPosts = posts.slice(0, 3);
  const activityPosts = posts
    .map((variant) => {
      const post =
        resolvedLocale === "ja" ? (variant.ja ?? variant.en) : (variant.en ?? variant.ja);
      if (!post) {
        return null;
      }
      return {
        slug: variant.slug,
        title: post.frontmatter.title || variant.slug,
        date: post.frontmatter.date ?? "",
        tags: post.frontmatter.tags ?? [],
        ...(post.frontmatter.category ? { category: post.frontmatter.category } : {}),
      };
    })
    .filter((post): post is NonNullable<typeof post> => Boolean(post));
  const pagePath = toLocalePath("/", resolvedLocale);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd data={buildBreadcrumbList([{ name: "Home", path: pagePath }])} />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-12 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="grid gap-4 md:grid-cols-4">
          {[
            {
              titleJa: "ブログ",
              titleEn: "Blog",
              descriptionJa: "新しい記事と開発メモを時系列で整理。",
              descriptionEn: "Browse new posts and development notes in chronological order.",
              href: "/blog",
            },
            {
              titleJa: "シリーズ",
              titleEn: "Series",
              descriptionJa: "テーマごとの連載記事をまとめて閲覧。",
              descriptionEn: "Explore curated series grouped by theme.",
              href: "/series",
            },
            {
              titleJa: "アーカイブ",
              titleEn: "Archive",
              descriptionJa: "テーマ別に蓄積した資料や年表の一覧。",
              descriptionEn: "A collection of archived notes and timelines.",
              href: "/archive",
            },
            {
              titleJa: "ツール",
              titleEn: "Tools",
              descriptionJa: "小さなツールやジェネレーターの公開場所。",
              descriptionEn: "A collection of small tools and generators.",
              href: "/tools",
            },
          ].map((item) => (
            <Card key={item.href} className="border-transparent bg-card/40 shadow-none">
              <a
                href={toLocalePath(item.href, resolvedLocale)}
                className="flex h-full flex-col gap-3 px-5 py-6"
              >
                <div className="text-lg font-semibold">
                  <I18nText locale={resolvedLocale} ja={item.titleJa} en={item.titleEn} />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  <I18nText
                    locale={resolvedLocale}
                    ja={item.descriptionJa}
                    en={item.descriptionEn}
                  />
                </p>
                <span className="text-xs font-medium text-muted-foreground">
                  <I18nText locale={resolvedLocale} ja="詳しく見る →" en="Learn more →" />
                </span>
              </a>
            </Card>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">
                <I18nText locale={resolvedLocale} ja="投稿カレンダー" en="Post Calendar" />
              </h2>
            </div>
            <a
              href={toLocalePath("/blog", resolvedLocale)}
              className="text-sm font-medium text-muted-foreground"
            >
              <I18nText locale={resolvedLocale} ja="ブログへ →" en="Go to blog →" />
            </a>
          </div>
          <Card className="border-transparent bg-card/40 shadow-none">
            <div className="px-5 py-5">
              <PostActivityHeatmap posts={activityPosts} locale={resolvedLocale} />
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              <I18nText locale={resolvedLocale} ja="最新のブログ" en="Latest Posts" />
            </h2>
            <a
              href={toLocalePath("/blog", resolvedLocale)}
              className="text-sm font-medium text-muted-foreground"
            >
              <I18nText locale={resolvedLocale} ja="すべて見る →" en="View all →" />
            </a>
          </div>
          <BlogPostList
            posts={latestPosts}
            locale={resolvedLocale}
            emptyMessage={{ ja: "まだ記事がありません。", en: "No posts yet." }}
            variant="detailed"
          />
        </section>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
