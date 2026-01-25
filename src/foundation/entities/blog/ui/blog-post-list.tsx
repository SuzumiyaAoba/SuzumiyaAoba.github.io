import Image from "next/image";
import { Icon } from "@iconify/react";

import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { cn } from "@/shared/lib/utils";
import type { LocalizedBlogPost } from "@/entities/blog/model/blog";
import { resolveThumbnail } from "@/shared/lib/thumbnail";

/**
 * 日付文字列を指定されたロケールの形式にフォーマットする
 * @param date 日付文字列 (YYYY-MM-DD)
 * @param locale ロケール識別子
 * @returns フォーマットされた日付文字列
 */
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

/**
 * 指定されたロケールに最適な記事データを取得する（存在しない場合は別言語でフォールバック）
 * @param variant 多言語対応した記事データ
 * @param locale 表示したいロケール
 * @returns 解決された単一言語の記事データ
 */
function resolvePost(variant: LocalizedBlogPost, locale: Locale) {
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
  posts: LocalizedBlogPost[];
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
              <Card className="group relative border-transparent bg-card/50 shadow-none transition-colors hover:bg-muted/30">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-1 rounded-[18px] bg-muted/40 opacity-0 transition duration-200 ease-out scale-95 group-hover:opacity-100 group-hover:scale-100"
                />
                <div className="relative z-10 flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-stretch md:gap-6">
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
                            className="size-24 sm:size-10 text-muted-foreground/70 dark:text-muted-foreground/80"
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
