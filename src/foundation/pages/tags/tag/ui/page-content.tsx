import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { BackLink } from "@/shared/ui/back-link";
import { Badge } from "@/shared/ui/badge";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import {
  buildBreadcrumbList,
  buildDetailBreadcrumbItems,
  toLocalePath,
  type Locale,
} from "@/shared/lib/routing";
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

export function TagDetailPageContent({ locale, tag, entries }: TagDetailPageContentProps) {
  const pagePath = toLocalePath(`/tags/${encodeURIComponent(tag)}`, locale);
  const breadcrumbItems = buildDetailBreadcrumbItems(
    locale,
    { name: "Tags", path: "/tags" },
    { name: tag, path: pagePath },
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main
        className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12"
        data-pagefind-ignore="all"
      >
        <Breadcrumbs items={breadcrumbItems} className="mb-2" />
        <section className="space-y-3">
          <BackLink locale={locale} href="/tags" ja="← タグ一覧" en="← Back to tags" />
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
          {entries.map((post) => (
            <li key={`${locale}-${post.slug}`}>
              <BlogPostCard post={post} locale={locale} thumbnailIconClassName="size-10" />
            </li>
          ))}
        </ul>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
