import Image from "next/image";
import { Icon } from "@iconify/react";

import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";
import { cn } from "@/shared/lib/utils";
import type { LocalizedBlogPost } from "@/entities/blog/model/blog";
import { resolveThumbnail } from "@/shared/lib/thumbnail";

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

function resolvePost(variant: LocalizedBlogPost, locale: Locale) {
  return locale === "ja" ? (variant.ja ?? variant.en) : (variant.en ?? variant.ja);
}

type EmptyMessage = {
  ja: string;
  en: string;
};

type BlogPostListProps = {
  posts: LocalizedBlogPost[];
  locale: Locale;
  className?: string;
  emptyMessage?: EmptyMessage;
  showThumbnail?: boolean;
  variant?: "compact" | "detailed";
  enableTagLinks?: boolean;
};

export function BlogPostList({
  posts,
  locale,
  className,
  emptyMessage,
  showThumbnail,
  variant = "compact",
  enableTagLinks,
}: BlogPostListProps) {
  const dateLocale = locale === "en" ? "en-US" : "ja-JP";
  const withThumbnail = showThumbnail ?? variant === "detailed";
  const withTagLinks = enableTagLinks ?? variant === "detailed";

  if (posts.length === 0) {
    if (!emptyMessage) return null;
    return (
      <Card className={cn("border-transparent bg-card/40 shadow-none", className)}>
        <div className="px-5 py-6 text-sm text-muted-foreground">
          <I18nText locale={locale} ja={emptyMessage.ja} en={emptyMessage.en} />
        </div>
      </Card>
    );
  }

  return (
    <ul className={cn("space-y-4", className)}>
      {posts.map((variantItem) => {
        const post = resolvePost(variantItem, locale);
        if (!post) return null;
        const postSlug = variantItem.slug;
        const title = post.frontmatter.title || postSlug;
        const thumbnail = resolveThumbnail(variantItem.slug, post.frontmatter.thumbnail);
        const isFallback = thumbnail.type === "image" && thumbnail.isFallback;
        const tags = post.frontmatter.tags ?? [];
        const category = post.frontmatter.category;

        if (variant === "detailed") {
          return (
            <li key={postSlug}>
              <Card className="group border-transparent bg-card/50 shadow-none transition-colors hover:bg-card/70">
                <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-stretch md:gap-6">
                  {withThumbnail ? (
                    <a
                      href={toLocalePath(`/blog/post/${postSlug}`, locale)}
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
                  ) : null}
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
                        href={toLocalePath(`/blog/post/${postSlug}`, locale)}
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
                            {...(withTagLinks
                              ? { href: toLocalePath(`/tags/${encodeURIComponent(tag)}`, locale) }
                              : {})}
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
        }

        return (
          <li key={postSlug}>
            <Card className="border-transparent bg-card/40 shadow-none">
              <a
                href={toLocalePath(`/blog/post/${postSlug}`, locale)}
                className={cn(
                  "flex gap-3 px-5 py-5",
                  withThumbnail ? "flex-row items-start" : "flex-col",
                )}
              >
                {withThumbnail ? (
                  <span className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-md border border-muted bg-muted">
                    {thumbnail.type === "image" ? (
                      <Image
                        src={thumbnail.src}
                        alt={isFallback ? "Site icon" : title}
                        fill
                        sizes="96px"
                        className={
                          isFallback
                            ? "object-contain p-3 opacity-70 dark:invert dark:opacity-80"
                            : "object-cover"
                        }
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <Icon
                          icon={thumbnail.icon}
                          className="size-6 text-muted-foreground/70 dark:text-muted-foreground/80"
                          aria-hidden
                        />
                        <span className="sr-only">{title}</span>
                      </span>
                    )}
                  </span>
                ) : null}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(post.frontmatter.date ?? "", dateLocale)}</span>
                    {category ? (
                      <Badge
                        variant="secondary"
                        className="bg-muted/70 text-[11px] text-muted-foreground"
                      >
                        {category}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-foreground">{title}</p>
                    {tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {tags.slice(0, 3).map((tag) => (
                          <Tag
                            key={tag}
                            tag={tag}
                            {...(withTagLinks
                              ? { href: toLocalePath(`/tags/${encodeURIComponent(tag)}`, locale) }
                              : {})}
                            className="bg-muted text-[11px] font-medium text-muted-foreground"
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </a>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
