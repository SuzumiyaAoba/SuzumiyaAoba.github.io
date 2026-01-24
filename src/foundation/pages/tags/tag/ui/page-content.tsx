import Image from "next/image";
import { Icon } from "@iconify/react";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
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

export type TagDetailPageContentProps = {
  locale: Locale;
  tag: string;
  entries: {
    slug: string;
    title: string;
    date: string;
    tags: string[];
    category?: string | undefined;
    thumbnail?: string | undefined;
  }[];
};

export function TagDetailPageContent({ locale, tag, entries }: TagDetailPageContentProps) {
  const pagePath = toLocalePath(`/tags/${encodeURIComponent(tag)}`, locale);
  const dateLocale = locale === "en" ? "en-US" : "ja-JP";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Tags", path: toLocalePath("/tags", locale) },
          { name: tag, path: pagePath },
        ])}
      />
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12"
        data-pagefind-ignore="all"
      >
        <Breadcrumbs
          items={[
            { name: "Home", path: toLocalePath("/", locale) },
            { name: "Tags", path: toLocalePath("/tags", locale) },
            { name: tag, path: pagePath },
          ]}
          className="mb-2"
        />
        <section className="space-y-3">
          <a
            href={toLocalePath("/tags", locale)}
            className="text-xs font-medium text-muted-foreground"
          >
            <I18nText locale={locale} ja="← タグ一覧" en="← Back to tags" />
          </a>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold">#{tag}</h1>
            <Badge
              variant="secondary"
              className="bg-muted text-xs font-medium text-muted-foreground"
            >
              <I18nText
                locale={locale}
                ja={`${entries.length} 件`}
                en={`${entries.length} posts`}
              />
            </Badge>
          </div>
        </section>

        <ul className="space-y-5">
          {entries.map((post) => {
            const thumbnail = resolveThumbnail(post.slug, post.thumbnail);
            const isFallback = thumbnail.type === "image" && thumbnail.isFallback;
            return (
              <li key={`${locale}-${post.slug}`}>
                <Card className="group border-transparent bg-card/50 shadow-none transition-colors hover:bg-card/70">
                  <a
                    href={toLocalePath(`/blog/post/${post.slug}`, locale)}
                    className="flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-stretch md:gap-6"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-muted bg-muted md:w-44">
                      {thumbnail.type === "image" ? (
                        <Image
                          src={thumbnail.src}
                          alt={isFallback ? "Site icon" : post.title}
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
                          <span className="sr-only">{post.title}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-2 py-2">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDate(post.date, dateLocale)}</span>
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
                              key={`${locale}-${tagName}`}
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
      </main>
      <Footer locale={locale} />
    </div>
  );
}
