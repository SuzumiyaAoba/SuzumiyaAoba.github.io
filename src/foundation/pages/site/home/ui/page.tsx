
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getBlogPosts } from "@/entities/blog";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { Tag } from "@/shared/ui/tag";

function formatDate(date: string): string {
  if (!date) {
    return "Unknown date";
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function Page() {
  const posts = await getBlogPosts();
  const latestPosts = posts.slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <JsonLd data={buildBreadcrumbList([{ name: "Home", path: "/" }])} />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-12 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "ブログ",
              description: "新しい記事と開発メモを時系列で整理。",
              href: "/blog",
            },
            {
              title: "シリーズ",
              description: "テーマごとの連載記事をまとめて閲覧。",
              href: "/series",
            },
            {
              title: "ツール",
              description: "小さなツールやジェネレーターの公開場所。",
              href: "/tools",
            },
          ].map((item) => (
            <Card key={item.title} className="border-transparent bg-card/40 shadow-none">
              <a href={item.href} className="flex h-full flex-col gap-3 px-5 py-6">
                <div className="text-lg font-semibold">{item.title}</div>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                <span className="text-xs font-medium text-muted-foreground">詳しく見る →</span>
              </a>
            </Card>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">最新のブログ</h2>
            <a href="/blog" className="text-sm font-medium text-muted-foreground">
              すべて見る →
            </a>
          </div>
          {latestPosts.length === 0 ? (
            <Card className="border-transparent bg-card/40 shadow-none">
              <div className="px-5 py-6 text-sm text-muted-foreground">まだ記事がありません。</div>
            </Card>
          ) : (
            <ul className="space-y-4">
              {latestPosts.map((post) => (
                <li key={post.slug}>
                  <Card className="border-transparent bg-card/40 shadow-none">
                    <a
                      href={`/blog/post/${post.slug}`}
                      className="flex flex-col gap-3 px-5 py-5"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(post.frontmatter.date)}</span>
                        {post.frontmatter.category ? (
                          <Badge
                            variant="secondary"
                            className="bg-muted/70 text-[11px] text-muted-foreground"
                          >
                            {post.frontmatter.category}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-foreground">
                          {post.frontmatter.title || post.slug}
                        </p>
                        {post.frontmatter.tags?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {post.frontmatter.tags.slice(0, 3).map((tag) => (
                              <Tag
                                key={tag}
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
        </section>
      </main>
      <Footer />
    </div>
  );
}
