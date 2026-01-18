import Image from "next/image";
import { Icon } from "@iconify/react";

import { notFound } from "next/navigation";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getBlogPostsVariants } from "@/entities/blog";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { Tag } from "@/shared/ui/tag";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";
import { resolveThumbnail } from "@/shared/lib/thumbnail";

const POSTS_PER_PAGE = 10;

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

function getPageCount(total: number): number {
  return Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
}

type PageProps = {
  params: Promise<{ page: string }>;
  locale?: Locale;
};

export default async function Page({ params, locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const { page } = await params;
  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    notFound();
  }

  const posts = await getBlogPostsVariants();
  const pageCount = getPageCount(posts.length);

  if (pageNumber > pageCount) {
    notFound();
  }

  const start = (pageNumber - 1) * POSTS_PER_PAGE;
  const pagePosts = posts.slice(start, start + POSTS_PER_PAGE);
  const pagePath = toLocalePath(pageNumber === 1 ? "/blog" : `/blog/${pageNumber}`, resolvedLocale);
  const dateLocale = resolvedLocale === "en" ? "en-US" : "ja-JP";
  const pageLabel = resolvedLocale === "en" ? `Page ${pageNumber}` : `ページ ${pageNumber}`;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: "Blog", path: toLocalePath("/blog", resolvedLocale) },
          { name: pageLabel, path: pagePath },
        ])}
      />
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12"
        data-pagefind-ignore="all"
      >
        <Breadcrumbs
          items={[
            { name: "Home", path: toLocalePath("/", resolvedLocale) },
            { name: "Blog", path: toLocalePath("/blog", resolvedLocale) },
            {
              name: pageLabel,
              path: pagePath,
            },
          ]}
        />
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={resolvedLocale} ja="ブログ" en="Blog" />
          </h1>
          <div className="text-sm text-muted-foreground">{pageLabel}</div>
        </section>

        <ul className="space-y-5">
          {pagePosts.map((variant) => {
            const post =
              resolvedLocale === "en" ? (variant.en ?? variant.ja) : (variant.ja ?? variant.en);
            if (!post) return null;
            const title = post.frontmatter.title || variant.slug;
            const tags = post.frontmatter.tags ?? [];
            const category = post.frontmatter.category;
            const thumbnail = resolveThumbnail(variant.slug, post.frontmatter.thumbnail);
            const isFallback = thumbnail.type === "image" && thumbnail.isFallback;
            return (
              <li key={variant.slug}>
                <Card className="group border-transparent bg-card/50 shadow-none transition-colors hover:bg-card/70">
                  <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-stretch md:gap-6">
                    <a
                      href={toLocalePath(`/blog/post/${variant.slug}`, resolvedLocale)}
                      className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-muted bg-muted md:w-44"
                    >
                      {thumbnail.type === "image" ? (
                        <Image
                          src={thumbnail.src}
                          alt={isFallback ? "Site icon" : title}
                          fill
                          sizes="(min-width: 768px) 176px, 100vw"
                          className={
                            isFallback
                              ? "object-contain p-6 opacity-70 dark:invert dark:opacity-80"
                              : "object-cover"
                          }
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Icon
                            icon={thumbnail.icon}
                            className="size-10 text-muted-foreground/70 dark:text-muted-foreground/80"
                            aria-hidden
                          />
                          <span className="sr-only">{title}</span>
                        </div>
                      )}
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

        <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          {pageNumber > 1 ? (
            <a
              href={toLocalePath(
                pageNumber === 2 ? "/blog" : `/blog/${pageNumber - 1}`,
                resolvedLocale,
              )}
              className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
            >
              <I18nText locale={resolvedLocale} ja="← 前のページ" en="← Previous page" />
            </a>
          ) : (
            <span className="w-[5.5rem]" />
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {Array.from({ length: pageCount }, (_, index) => {
              const page = index + 1;
              const href = page === 1 ? "/blog" : `/blog/${page}`;
              const isActive = page === pageNumber;
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
          </div>
          {pageNumber < pageCount ? (
            <a
              href={toLocalePath(`/blog/${pageNumber + 1}`, resolvedLocale)}
              className="font-medium text-foreground underline decoration-foreground/40 underline-offset-4"
            >
              <I18nText locale={resolvedLocale} ja="次のページ →" en="Next page →" />
            </a>
          ) : (
            <span className="w-[5.5rem]" />
          )}
        </nav>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
