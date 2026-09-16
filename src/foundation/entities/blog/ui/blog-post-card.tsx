import Image from "next/image";
import { Icon } from "@/shared/ui/icon";
import { Badge } from "@/shared/ui/badge";
import { Tag } from "@/shared/ui/tag";
import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
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
  /** カード全体の記事リンクに加えて、タグを個別のリンクにする。 */
  interactive?: boolean;
  /** サムネイルの代替アイコンの大きさ（lg は一覧カード用）。 */
  thumbnailIconSize?: "default" | "lg";
  layout?: "list" | "featured" | "compact";
  headingLevel?: "h2" | "h3";
};

export function BlogPostCard({
  post,
  locale,
  interactive = false,
  thumbnailIconSize = "default",
  layout = "list",
  headingLevel: Heading = "h2",
}: BlogPostCardProps) {
  const thumbnail = resolveThumbnail(post.slug, post.thumbnail);
  const isFallback = thumbnail.type === "image" && thumbnail.isFallback;
  const isGraphic = thumbnail.type === "icon" || isFallback;
  const postHref = toLocalePath(`/blog/post/${post.slug}`, locale);

  const content = (
    <div className="journal-card-content">
      <div className="journal-thumbnail">
        {layout === "featured" && isGraphic && (
          <span className="journal-featured-label eyebrow" aria-hidden="true">
            LATEST ENTRY
          </span>
        )}
        {thumbnail.type === "image" ? (
          <Image
            src={thumbnail.src}
            alt=""
            fill
            sizes={
              layout === "featured"
                ? "(min-width: 1024px) 540px, (min-width: 640px) 80vw, 90vw"
                : "(min-width: 768px) 96px, 64px"
            }
            className={
              isFallback
                ? "object-contain p-4 opacity-70 sm:p-6 dark:invert"
                : "object-cover"
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon
              icon={thumbnail.icon}
              className={
                layout === "featured"
                  ? "size-20 text-(--brand)"
                  : thumbnailIconSize === "lg"
                    ? "size-10 text-muted-foreground"
                    : "size-8 text-muted-foreground sm:size-10"
              }
              aria-hidden
            />
          </div>
        )}
      </div>
      <div className="journal-card-copy min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {post.date && (
            <time
              dateTime={post.date}
              className="font-mono text-label tabular-nums"
            >
              {formatDate(post.date, toIntlLocaleTag(locale))}
            </time>
          )}
          {post.category && <Badge variant="ghost">{post.category}</Badge>}
        </div>
        <Heading className="journal-card-title">
          {interactive ? (
            <a href={postHref} className="journal-card-link">
              {post.title}
            </a>
          ) : (
            post.title
          )}
        </Heading>
      </div>
      {post.tags.length > 0 && (
        <div className="journal-card-tags flex flex-wrap gap-x-3 gap-y-1">
          {post.tags.map((tag) => (
            <Tag
              key={tag}
              tag={tag}
              variant="ghost"
              {...(interactive
                ? {
                    href: toLocalePath(
                      `/tags/${encodeURIComponent(tag)}`,
                      locale
                    ),
                  }
                : {})}
              className={cn("min-h-8", interactive && "relative z-10")}
            />
          ))}
        </div>
      )}
      <span className="journal-card-arrow" aria-hidden="true">
        →
      </span>
    </div>
  );

  return (
    <article className={cn("journal-card group", `journal-card-${layout}`)}>
      {interactive ? (
        content
      ) : (
        <a href={postHref} className="journal-card-link block">
          {content}
        </a>
      )}
    </article>
  );
}
