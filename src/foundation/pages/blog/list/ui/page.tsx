import Image from "next/image";

import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getBlogPostsVariants } from "@/entities/blog";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";

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

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const pagePath = toLocalePath("/blog", resolvedLocale);
  const dateLocale = resolvedLocale === "en" ? "en-US" : "ja-JP";
  const posts = await getBlogPostsVariants();
  const pagePosts = posts.slice(0, 10);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: "Blog", path: pagePath },
        ])}
      />
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12"
        data-pagefind-ignore="all"
      >
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={resolvedLocale} ja="ブログ" en="Blog" />
          </h1>
        </section>

        <ul className="space-y-5">
          {pagePosts.map((variant) => {
            const post =
              resolvedLocale === "en" ? (variant.en ?? variant.ja) : (variant.ja ?? variant.en);
            if (!post) return null;
            const title = post.frontmatter.title || variant.slug;
            const tags = post.frontmatter.tags ?? [];
            const category = post.frontmatter.category;
            const altTitle = title;
            const thumbnail = resolveThumbnail(variant.slug, post.frontmatter.thumbnail);
            const isFallback = thumbnail === "/icon.svg";
            return (
              <li key={variant.slug}>
                <Card className="group border-transparent bg-card/50 shadow-none transition-colors hover:bg-card/70">
                  <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-stretch md:gap-6">
                    <a
                      href={toLocalePath(`/blog/post/${variant.slug}`, resolvedLocale)}
                      className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-muted bg-muted md:w-44"
                    >
                      <Image
                        src={thumbnail}
                        alt={isFallback ? "Site icon" : altTitle}
                        fill
                        sizes="(min-width: 768px) 176px, 100vw"
                        className={
                          isFallback
                            ? "object-contain p-6 opacity-70 dark:invert dark:opacity-80"
                            : "object-cover"
                        }
                      />
                    </a>
                    <div className="flex-1 flex flex-col gap-2 py-2">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDate(post.frontmatter.date ?? "", dateLocale)}</span>
                          {category ? (
                            <Badge
                              variant="outline"
                              className="border-border/40 text-[11px] font-medium"
                            >
                              {category}
                            </Badge>
                          ) : null}
                        </div>
                        <a
                          href={toLocalePath(`/blog/post/${variant.slug}`, resolvedLocale)}
                          className="block text-lg font-semibold text-foreground transition-colors group-hover:text-foreground/80"
                        >
                          {title}
                        </a>
                      </div>
                      {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 md:mt-auto">
                          {tags.map((tag) => (
                            <Tag
                              key={tag}
                              tag={tag}
                              href={toLocalePath(
                                `/tags/${encodeURIComponent(tag)}`,
                                resolvedLocale,
                              )}
                              className="bg-muted text-xs font-medium text-muted-foreground"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>

        {posts.length > 10 ? (
          <nav className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            {Array.from({ length: Math.ceil(posts.length / 10) }, (_, index) => {
              const page = index + 1;
              const href = page === 1 ? "/blog" : `/blog/${page}`;
              const isActive = page === 1;
              return (
                <a
                  key={page}
                  href={toLocalePath(href, resolvedLocale)}
                  className={
                    isActive
                      ? "rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background"
                      : "rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                  }
                >
                  {page}
                </a>
              );
            })}
          </nav>
        ) : null}
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
