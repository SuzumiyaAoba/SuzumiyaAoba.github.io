import { SiteLayout } from "@/widgets/site-layout";
import { BackLink } from "@/shared/ui/back-link";
import { Badge } from "@/shared/ui/badge";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import {
  buildBreadcrumbList,
  buildDetailBreadcrumbItems,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { BlogPostCard } from "@/entities/blog";

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

export function TagDetailPageContent({
  locale,
  tag,
  entries,
}: TagDetailPageContentProps) {
  const pagePath = toLocalePath(`/tags/${encodeURIComponent(tag)}`, locale);
  const breadcrumbItems = buildDetailBreadcrumbItems(
    locale,
    { name: "Tags", path: "/tags" },
    { name: tag, path: pagePath }
  );

  return (
    <SiteLayout locale={locale} path={pagePath}>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack" data-pagefind-ignore="all">
        <Breadcrumbs items={breadcrumbItems} />
        <section className="space-y-3">
          <BackLink
            locale={locale}
            href="/tags"
            ja="← タグ一覧"
            en="← Back to tags"
          />
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl leading-snug font-semibold sm:text-3xl">
              #{tag}
            </h1>
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

        <ul className="post-list">
          {entries.map((post) => (
            <li key={`${locale}-${post.slug}`}>
              <BlogPostCard
                post={post}
                locale={locale}
                thumbnailIconClassName="size-10"
              />
            </li>
          ))}
        </ul>
      </main>
    </SiteLayout>
  );
}
