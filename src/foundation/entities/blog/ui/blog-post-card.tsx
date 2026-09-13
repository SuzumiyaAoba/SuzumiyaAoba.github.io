import Image from "next/image";
import { Icon } from "@/shared/ui/icon";
import { Badge } from "@/shared/ui/badge";
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
  /** カード全体の記事リンクに加えて、タグを個別のリンクにする。 */
  interactive?: boolean;
  thumbnailIconClassName?: string;
  layout?: "list" | "featured" | "compact";
  headingLevel?: "h2" | "h3";
};

export function BlogPostCard({
  post,
  locale,
  interactive = false,
  thumbnailIconClassName = "size-8 sm:size-10",
  layout = "list",
  headingLevel: Heading = "h2",
}: BlogPostCardProps) {
  const thumbnail = resolveThumbnail(post.slug, post.thumbnail);
  const isFallback = thumbnail.type === "image" && thumbnail.isFallback;
  const isGraphic = thumbnail.type === "icon" || isFallback;
  const postHref = toLocalePath(`/blog/post/${post.slug}`, locale);

  const content = (
    <div className="journal-card-content">
      <div className={cn("journal-thumbnail", isGraphic && "journal-thumbnail-art")}>
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
              isFallback ? "object-contain p-4 opacity-70 dark:invert sm:p-6" : "object-cover"
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Icon
              icon={thumbnail.icon}
              className={cn(
                layout === "featured"
                  ? "size-20 text-(--brand)"
                  : cn(thumbnailIconClassName, "text-muted-foreground"),
              )}
              aria-hidden
            />
          </div>
        )}
      </div>
      <div className="journal-card-copy min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {post.date && (
            <time dateTime={post.date} className="font-mono text-[11px] tabular-nums">
              {formatDate(post.date, toIntlLocaleTag(locale))}
            </time>
          )}
          {post.category && (
            <Badge
              variant="secondary"
              className="font-noto bg-transparent px-0 text-[11px] font-medium text-muted-foreground"
            >
              {post.category}
            </Badge>
          )}
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
              {...(interactive
                ? { href: toLocalePath(`/tags/${encodeURIComponent(tag)}`, locale) }
                : {})}
              className={cn(
                "font-noto min-h-8 rounded-sm bg-transparent px-0 text-[11px] font-medium text-muted-foreground",
                interactive && "relative z-10",
              )}
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
