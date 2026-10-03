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
import type { SeriesDefinition } from "@/entities/series-item";
import { PostIndex } from "@/entities/blog";
import type { PostIndexEntry } from "@/entities/blog";

export type SeriesDetailPageContentProps = {
  locale: Locale;
  series: SeriesDefinition;
  entries: PostIndexEntry[];
};

export function SeriesDetailPageContent({
  locale,
  series,
  entries,
}: SeriesDetailPageContentProps) {
  const pagePath = toLocalePath(`/series/${series.slug}`, locale);
  const breadcrumbItems = buildDetailBreadcrumbItems(
    locale,
    { name: "Series", path: "/series" },
    { name: series.name, path: pagePath }
  );
  const [first] = entries;

  return (
    <SiteLayout locale={locale} path={pagePath}>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="page-heading">
          <div>
            <p className="page-eyebrow">
              <I18nText locale={locale} ja="連載" en="Series" />
            </p>
            <h1 className="page-title">{series.name}</h1>
            {series.description ? (
              <p className="page-lead">{series.description}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <p className="page-count">
              <I18nText
                locale={locale}
                ja={`全 ${entries.length} 回`}
                en={`${entries.length} parts`}
              />
            </p>
            {first ? (
              <a
                href={toLocalePath(`/blog/post/${first.slug}`, locale)}
                className="arrow-link"
              >
                <I18nText
                  locale={locale}
                  ja="第 1 回から読む"
                  en="Start from part 1"
                />
                <span aria-hidden="true">→</span>
              </a>
            ) : null}
          </div>
        </header>

        {entries.length === 0 ? (
          <p className="empty-state">
            <I18nText
              locale={locale}
              ja="まだ記事がありません。"
              en="No posts yet."
            />
          </p>
        ) : (
          <PostIndex entries={entries} locale={locale} layout="numbered" />
        )}
      </main>
    </SiteLayout>
  );
}
