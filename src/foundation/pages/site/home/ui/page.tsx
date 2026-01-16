
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getBlogPostsVariants, type LocalizedBlogPost } from "@/entities/blog";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";

function formatDate(date: string, locale: string): string {
  if (!date) {
    return locale.startsWith("ja") ? "不明な日付" : "Unknown date";
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function resolvePost(variant: LocalizedBlogPost, locale: "ja" | "en") {
  return locale === "ja" ? variant.ja ?? variant.en : variant.en ?? variant.ja;
}

export default async function Page() {
  const posts = await getBlogPostsVariants();
  const latestPosts = posts.slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <JsonLd data={buildBreadcrumbList([{ name: "Home", path: "/" }])} />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-12 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="grid gap-4 md:grid-cols-3">
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
              titleJa: "ツール",
              titleEn: "Tools",
              descriptionJa: "小さなツールやジェネレーターの公開場所。",
              descriptionEn: "A collection of small tools and generators.",
              href: "/tools",
            },
          ].map((item) => (
            <Card key={item.href} className="border-transparent bg-card/40 shadow-none">
              <a href={item.href} className="flex h-full flex-col gap-3 px-5 py-6">
                <div className="text-lg font-semibold">
                  <I18nText ja={item.titleJa} en={item.titleEn} />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  <I18nText ja={item.descriptionJa} en={item.descriptionEn} />
                </p>
                <span className="text-xs font-medium text-muted-foreground">
                  <I18nText ja="詳しく見る →" en="Learn more →" />
                </span>
              </a>
            </Card>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">
              <I18nText ja="最新のブログ" en="Latest Posts" />
            </h2>
            <a href="/blog" className="text-sm font-medium text-muted-foreground">
              <I18nText ja="すべて見る →" en="View all →" />
            </a>
          </div>
          {latestPosts.length === 0 ? (
            <Card className="border-transparent bg-card/40 shadow-none">
              <div className="px-5 py-6 text-sm text-muted-foreground">
                <I18nText ja="まだ記事がありません。" en="No posts yet." />
              </div>
            </Card>
          ) : (
            <ul className="space-y-4">
              {latestPosts.map((variant) => {
                const postJa = resolvePost(variant, "ja");
                const postEn = resolvePost(variant, "en");
                if (!postJa && !postEn) return null;
                const postSlug = variant.slug;

                return (
                  <li key={postSlug}>
                  <Card className="border-transparent bg-card/40 shadow-none">
                    <a
                      href={`/blog/post/${postSlug}`}
                      className="flex flex-col gap-3 px-5 py-5"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="lang-ja">
                          {formatDate(postJa?.frontmatter.date ?? "", "ja-JP")}
                        </span>
                        <span className="lang-en">
                          {formatDate(postEn?.frontmatter.date ?? postJa?.frontmatter.date ?? "", "en-US")}
                        </span>
                        {postJa?.frontmatter.category ? (
                          <Badge
                            variant="secondary"
                            className="bg-muted/70 text-[11px] text-muted-foreground"
                          >
                            <span className="lang-ja">{postJa.frontmatter.category}</span>
                            <span className="lang-en">
                              {postEn?.frontmatter.category ?? postJa.frontmatter.category}
                            </span>
                          </Badge>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-foreground">
                          <span className="lang-ja">{postJa?.frontmatter.title || postSlug}</span>
                          <span className="lang-en">
                            {postEn?.frontmatter.title || postJa?.frontmatter.title || postSlug}
                          </span>
                        </p>
                        {postJa?.frontmatter.tags?.length ? (
                          <>
                            <div className="flex flex-wrap gap-2 lang-ja">
                              {postJa.frontmatter.tags.slice(0, 3).map((tag) => (
                                <Tag
                                  key={tag}
                                  tag={tag}
                                  className="bg-muted text-[11px] font-medium text-muted-foreground"
                                />
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2 lang-en">
                              {(postEn?.frontmatter.tags ?? postJa.frontmatter.tags)
                                .slice(0, 3)
                                .map((tag) => (
                                  <Tag
                                    key={`en-${tag}`}
                                    tag={tag}
                                    className="bg-muted text-[11px] font-medium text-muted-foreground"
                                  />
                                ))}
                            </div>
                          </>
                        ) : null}
                      </div>
                    </a>
                  </Card>
                </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
