import { SiteLayout } from "@/widgets/site-layout";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import {
  buildBreadcrumbList,
  buildDetailBreadcrumbItems,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { PostIndex } from "@/entities/blog";
import type { PostIndexEntry } from "@/entities/blog";

export type TagDetailPageContentProps = {
  locale: Locale;
  tag: string;
  entries: PostIndexEntry[];
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
        <header className="page-heading">
          <div>
            <p className="page-eyebrow">
              <I18nText locale={locale} ja="タグ" en="Tag" />
            </p>
            <h1 className="page-title">
              <span className="page-title-hash" aria-hidden="true">
                #
              </span>
              {tag}
            </h1>
          </div>
          <p className="page-count">
            <I18nText
              locale={locale}
              ja={`${entries.length} 件の記事`}
              en={`${entries.length} articles`}
            />
          </p>
        </header>

        <PostIndex entries={entries} locale={locale} />
      </main>
    </SiteLayout>
  );
}
