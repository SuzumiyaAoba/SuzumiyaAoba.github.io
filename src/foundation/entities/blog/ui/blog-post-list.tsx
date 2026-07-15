import Image from "next/image";
import { Icon } from "@iconify/react";

import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";
import type { LocalizedBlogPostSummary } from "@/entities/blog/model/blog";
import { resolveThumbnail } from "@/shared/lib/thumbnail";
import { formatDate, toIntlLocaleTag } from "@/shared/lib/presentation";
import { BlogPostCard } from "./blog-post-card";

/**
 * 指定されたロケールに最適な記事データを取得する（存在しない場合は別言語でフォールバック）
 * @param variant 多言語対応した記事データ
 * @param locale 表示したいロケール
 * @returns 解決された単一言語の記事データ
 */
function resolvePost(variant: LocalizedBlogPostSummary, locale: Locale) {
  return locale === "ja" ? (variant.ja ?? variant.en) : (variant.en ?? variant.ja);
}

/**
 * 記事が空の場合に表示するメッセージの多言語定義
 */
type EmptyMessage = {
  /** 日本語のメッセージ */
  ja: string;
  /** 英語のメッセージ */
  en: string;
};

/**
 * BlogPostList コンポーネントのプロパティ
 */
type BlogPostListProps = {
  /** 表示する記事のリスト（多言語バリアント） */
  posts: LocalizedBlogPostSummary[];
  /** 現在の表示ロケール */
  locale: Locale;
  /** 追加のスタイルクラス */
  className?: string;
  /** 記事が空の場合のメッセージ（指定しない場合は何も表示しない） */
  emptyMessage?: EmptyMessage;
  /** サムネイルを表示するかどうか */
  showThumbnail?: boolean;
  /** 表示バリアント（コンパクトまたは詳細） */
  variant?: "compact" | "detailed";
  /** タグをクリックした際にリンクとして機能させるかどうか */
  enableTagLinks?: boolean;
};

/**
 * ブログ記事のリストを表示するコンポーネント。
 * コンパクトな一覧表示と、詳細なカード表示の2つのバリアントをサポートします。
 */
export function BlogPostList({
  posts,
  locale,
  className,
  emptyMessage,
  showThumbnail,
  variant = "compact",
  enableTagLinks,
}: BlogPostListProps) {
  const dateLocale = toIntlLocaleTag(locale);
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
              <BlogPostCard
                post={{
                  slug: postSlug,
                  title,
                  date: post.frontmatter.date ?? "",
                  tags,
                  category,
                  thumbnail: post.frontmatter.thumbnail,
                }}
                locale={locale}
                interactive
                thumbnailIconClassName="size-24 sm:size-10"
              />
            </li>
          );
        }

        return (
          <li key={postSlug}>
            <Card className="group relative border-transparent bg-card/40 shadow-none transition-colors hover:bg-muted/20">
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-1 rounded-[18px] bg-muted/30 opacity-0 transition duration-200 ease-out scale-95 group-hover:opacity-100 group-hover:scale-100"
              />
              <a
                href={toLocalePath(`/blog/post/${postSlug}`, locale)}
                className={cn(
                  "relative z-10 flex gap-3 px-5 py-5",
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
                          className="size-16 sm:size-6 text-muted-foreground/70 dark:text-muted-foreground/80"
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
