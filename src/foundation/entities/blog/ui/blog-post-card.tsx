import Image from "next/image";
import { Icon } from "@iconify/react";

import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Tag } from "@/shared/ui/tag";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";
import { resolveThumbnail } from "@/shared/lib/thumbnail";
import { formatDate, toIntlLocaleTag } from "@/shared/lib/presentation";

export type BlogPostCardData = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  category?: string | undefined;
  thumbnail?: string | undefined;
};

export type BlogPostCardProps = {
  post: BlogPostCardData;
  locale: Locale;
  /**
   * true: ホバー時に装飾レイヤーが浮き上がり、サムネイルとタイトルが独立したリンクになり、
   * タグもリンクになる(BlogPostList の detailed バリアント相当)。
   * false: カード全体が1つのリンクになり、タグはリンクにならないシンプルな見た目
   * (タグ詳細ページ相当)。
   */
  interactive?: boolean;
  /** サムネイルが無い場合に表示するfallbackアイコンのサイズクラス */
  thumbnailIconClassName?: string;
};

/**
 * ブログ記事1件分のカードUI。BlogPostList(detailed)とタグ詳細ページで
 * 見た目のバリエーションが異なるため interactive フラグで吸収する。
 */
export function BlogPostCard({
  post,
  locale,
  interactive = false,
  thumbnailIconClassName = "size-10",
}: BlogPostCardProps) {
  const dateLocale = toIntlLocaleTag(locale);
  const thumbnail = resolveThumbnail(post.slug, post.thumbnail);
  const isFallback = thumbnail.type === "image" && thumbnail.isFallback;
  const postHref = toLocalePath(`/blog/post/${post.slug}`, locale);

  const thumbnailInner =
    thumbnail.type === "image" ? (
      <Image
        src={thumbnail.src}
        alt={isFallback ? "Site icon" : post.title}
        fill
        sizes="(min-width: 768px) 176px, 100vw"
        className={
          isFallback ? "object-contain p-6 opacity-70 dark:invert dark:opacity-80" : "object-cover"
        }
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center">
        <Icon
          icon={thumbnail.icon}
          className={cn(thumbnailIconClassName, "text-muted-foreground/70 dark:text-muted-foreground/80")}
          aria-hidden
        />
        <span className="sr-only">{post.title}</span>
      </div>
    );

  const thumbnailBox = interactive ? (
    <a
      href={postHref}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-muted bg-muted md:w-44"
    >
      {thumbnailInner}
    </a>
  ) : (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-muted bg-muted md:w-44">
      {thumbnailInner}
    </div>
  );

  const titleElement = interactive ? (
    <a
      href={postHref}
      className="block text-lg font-semibold text-foreground transition-colors group-hover:text-foreground/80"
    >
      {post.title}
    </a>
  ) : (
    <p className="text-lg font-semibold text-foreground transition-colors group-hover:text-foreground/80">
      {post.title}
    </p>
  );

  const content = (
    <div
      className={cn(
        "flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-stretch md:gap-6",
        interactive && "relative z-10",
      )}
    >
      {thumbnailBox}
      <div className="flex-1 flex flex-col gap-2 py-2">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDate(post.date, dateLocale)}</span>
            {post.category ? (
              <Badge variant="outline" className="border-border/40 text-[11px] font-medium">
                {post.category}
              </Badge>
            ) : null}
          </div>
          {titleElement}
        </div>
        {post.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 md:mt-auto">
            {post.tags.map((tag) => (
              <Tag
                key={tag}
                tag={tag}
                {...(interactive
                  ? { href: toLocalePath(`/tags/${encodeURIComponent(tag)}`, locale) }
                  : {})}
                className="bg-muted text-xs font-medium text-muted-foreground"
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <Card
      className={cn(
        "group border-transparent bg-card/50 shadow-none transition-colors",
        interactive ? "relative hover:bg-muted/30" : "hover:bg-card/70",
      )}
    >
      {interactive ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-[18px] bg-muted/40 opacity-0 transition duration-200 ease-out scale-95 group-hover:opacity-100 group-hover:scale-100"
        />
      ) : null}
      {interactive ? content : <a href={postHref}>{content}</a>}
    </Card>
  );
}
