import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getBlogPostSummariesVariants } from "@/entities/blog";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, resolveLocale, type Locale } from "@/shared/lib/routing";
import { BlogPostList } from "@/entities/blog";
import { PostActivityHeatmap } from "./post-activity-heatmap";

type PageProps = {
  locale?: Locale;
};

export type HomePageContentProps = {
  locale: Locale;
  latestPosts: BlogPostListProps["posts"];
  activityPosts: React.ComponentProps<typeof PostActivityHeatmap>["posts"];
};

import { type ComponentProps } from "react";
type BlogPostListProps = ComponentProps<typeof BlogPostList>;

export function HomePageContent({ locale, latestPosts, activityPosts }: HomePageContentProps) {
  const pagePath = toLocalePath("/", locale);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <JsonLd data={buildBreadcrumbList([{ name: "Home", path: pagePath }])} />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-12 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">
                <I18nText locale={locale} ja="投稿カレンダー" en="Post Calendar" />
              </h2>
            </div>
            <a
              href={toLocalePath("/blog", locale)}
              className="text-sm font-medium text-muted-foreground"
            >
              <I18nText locale={locale} ja="ブログへ →" en="Go to blog →" />
            </a>
          </div>
          <Card className="border-transparent bg-card/40 shadow-none">
            <div className="px-5 py-5">
              <PostActivityHeatmap posts={activityPosts} locale={locale} />
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              <I18nText locale={locale} ja="最新のブログ" en="Latest Posts" />
            </h2>
            <a
              href={toLocalePath("/blog", locale)}
              className="text-sm font-medium text-muted-foreground"
            >
              <I18nText locale={locale} ja="すべて見る →" en="View all →" />
            </a>
          </div>
          <BlogPostList
            posts={latestPosts}
            locale={locale}
            emptyMessage={{ ja: "まだ記事がありません。", en: "No posts yet." }}
            variant="detailed"
          />
        </section>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default async function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  const posts = await getBlogPostSummariesVariants();
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

  return (
    <HomePageContent
      locale={resolvedLocale}
      latestPosts={latestPosts}
      activityPosts={activityPosts}
    />
  );
}
