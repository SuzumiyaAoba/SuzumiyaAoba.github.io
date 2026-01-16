import Image from "next/image";

import { notFound } from "next/navigation";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getBlogPostsVariants, type BlogPost } from "@/entities/blog";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";

type PageProps = {
  params: Promise<{ tag: string }>;
};

function normalizeTagParam(tag: string): string {
  try {
    return decodeURIComponent(tag);
  } catch {
    return tag;
  }
}

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

function resolveThumbnail(slug: string, thumbnail?: string): string {
  if (!thumbnail) {
    return "/icon.svg";
  }

  let resolvedPath: string;
  if (
    thumbnail.startsWith("http://") ||
    thumbnail.startsWith("https://") ||
    thumbnail.startsWith("/")
  ) {
    resolvedPath = thumbnail;
  } else {
    resolvedPath = `/contents/blog/${slug}/${thumbnail}`;
  }

  // Convert supported image formats to webp
  if (/\.(png|jpe?g)$/i.test(resolvedPath)) {
    return resolvedPath.replace(/\.(png|jpe?g)$/i, ".webp");
  }

  return resolvedPath;
}

export default async function Page({ params }: PageProps) {
  const { tag } = await params;
  const decodedTag = normalizeTagParam(tag);
  const posts = await getBlogPostsVariants();
  const postsJa = posts.map((post) => post.ja ?? post.en).filter(Boolean) as BlogPost[];
  const postsEn = posts.map((post) => post.en ?? post.ja).filter(Boolean) as BlogPost[];
  const entriesJa = postsJa
    .filter((post) => (post.frontmatter.tags ?? []).includes(decodedTag))
    .map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title || post.slug,
      date: post.frontmatter.date,
      tags: (post.frontmatter.tags ?? []).filter((item) => item !== decodedTag),
      category: post.frontmatter.category,
      thumbnail: post.frontmatter.thumbnail,
    }));
  const entriesEn = postsEn
    .filter((post) => (post.frontmatter.tags ?? []).includes(decodedTag))
    .map((post) => ({
      slug: post.slug,
      title: post.frontmatter.title || post.slug,
      date: post.frontmatter.date,
      tags: (post.frontmatter.tags ?? []).filter((item) => item !== decodedTag),
      category: post.frontmatter.category,
      thumbnail: post.frontmatter.thumbnail,
    }));

  if (entriesJa.length === 0 && entriesEn.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: "/" },
          { name: "Tags", path: "/tags" },
          { name: decodedTag, path: `/tags/${encodeURIComponent(decodedTag)}` },
        ])}
      />
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12"
        data-pagefind-ignore="all"
      >
        <div className="lang-ja">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Tags", path: "/tags" },
              { name: decodedTag, path: `/tags/${encodeURIComponent(decodedTag)}` },
            ]}
            className="mb-2"
          />
        </div>
        <div className="lang-en">
          <Breadcrumbs
            items={[
              { name: "Home", path: "/" },
              { name: "Tags", path: "/tags" },
              { name: decodedTag, path: `/tags/${encodeURIComponent(decodedTag)}` },
            ]}
            className="mb-2"
          />
        </div>
        <section className="space-y-3">
          <a href="/tags" className="text-xs font-medium text-muted-foreground">
            <I18nText ja="← タグ一覧" en="← Back to tags" />
          </a>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold">#{decodedTag}</h1>
            <Badge
              variant="secondary"
              className="bg-muted text-xs font-medium text-muted-foreground"
            >
              <span className="lang-ja">{entriesJa.length} 件</span>
              <span className="lang-en">{entriesEn.length} posts</span>
            </Badge>
          </div>
        </section>

        <div className="lang-ja">
          <ul className="space-y-5">
            {entriesJa.map((post) => {
              const thumbnail = resolveThumbnail(post.slug, post.thumbnail);
              const isFallback = thumbnail === "/icon.svg";
              return (
                <li key={post.slug}>
                  <Card className="group border-transparent bg-card/50 shadow-none transition-colors hover:bg-card/70">
                    <a
                      href={`/blog/post/${post.slug}`}
                      className="flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-stretch md:gap-6"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-muted bg-muted md:w-44">
                        <Image
                          src={thumbnail}
                          alt={isFallback ? "Site icon" : post.title}
                          fill
                          sizes="(min-width: 768px) 176px, 100vw"
                          className={
                            isFallback
                              ? "object-contain p-6 opacity-70 dark:invert dark:opacity-80"
                              : "object-cover"
                          }
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-2 py-2">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDate(post.date, "ja-JP")}</span>
                            {post.category ? (
                              <Badge
                                variant="outline"
                                className="border-border/40 text-[11px] font-medium"
                              >
                                {post.category}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-lg font-semibold text-foreground transition-colors group-hover:text-foreground/80">
                            {post.title}
                          </p>
                        </div>
                        {post.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-2 md:mt-auto">
                            {post.tags.map((tagName) => (
                              <Tag
                                key={tagName}
                                tag={tagName}
                                className="bg-muted text-xs font-medium text-muted-foreground"
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </a>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="lang-en">
          <ul className="space-y-5">
            {entriesEn.map((post) => {
              const thumbnail = resolveThumbnail(post.slug, post.thumbnail);
              const isFallback = thumbnail === "/icon.svg";
              return (
                <li key={`en-${post.slug}`}>
                  <Card className="group border-transparent bg-card/50 shadow-none transition-colors hover:bg-card/70">
                    <a
                      href={`/blog/post/${post.slug}`}
                      className="flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-stretch md:gap-6"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-muted bg-muted md:w-44">
                        <Image
                          src={thumbnail}
                          alt={isFallback ? "Site icon" : post.title}
                          fill
                          sizes="(min-width: 768px) 176px, 100vw"
                          className={
                            isFallback
                              ? "object-contain p-6 opacity-70 dark:invert dark:opacity-80"
                              : "object-cover"
                          }
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-2 py-2">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDate(post.date, "en-US")}</span>
                            {post.category ? (
                              <Badge
                                variant="outline"
                                className="border-border/40 text-[11px] font-medium"
                              >
                                {post.category}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-lg font-semibold text-foreground transition-colors group-hover:text-foreground/80">
                            {post.title}
                          </p>
                        </div>
                        {post.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-2 md:mt-auto">
                            {post.tags.map((tagName) => (
                              <Tag
                                key={`en-${tagName}`}
                                tag={tagName}
                                className="bg-muted text-xs font-medium text-muted-foreground"
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </a>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
