import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getBlogPostSummariesVariants } from "@/entities/blog";
import { buildBreadcrumbList } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, resolveLocale, type Locale } from "@/shared/lib/routing";
import { BlogPostList } from "@/entities/blog";

type PageProps = {
  locale?: Locale;
};

export type HomePageContentProps = {
  locale: Locale;
  latestPosts: BlogPostListProps["posts"];
};

import { type ComponentProps } from "react";
type BlogPostListProps = ComponentProps<typeof BlogPostList>;

export function HomePageContent({ locale, latestPosts }: HomePageContentProps) {
  const pagePath = toLocalePath("/", locale);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <JsonLd data={buildBreadcrumbList([{ name: "Home", path: pagePath }])} />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-12 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
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

  return <HomePageContent locale={resolvedLocale} latestPosts={latestPosts} />;
}
