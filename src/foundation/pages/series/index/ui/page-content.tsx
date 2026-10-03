import { SiteLayout } from "@/widgets/site-layout";

import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import { EntryCardList } from "@/shared/ui/entry-card-list";
import type { EntryCardItem } from "@/shared/ui/entry-card-list";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { SeriesDefinition } from "@/entities/series-item";

export type SeriesListPageContentProps = {
  locale: Locale;
  seriesList: SeriesDefinition[];
};

export function SeriesListPageContent({
  locale,
  seriesList,
}: SeriesListPageContentProps) {
  const pagePath = toLocalePath("/series", locale);
  const breadcrumbItems = buildListBreadcrumbItems(locale, {
    name: "Series",
    path: "/series",
  });

  const items: EntryCardItem[] = seriesList.map((series) => ({
    slug: series.slug,
    title: series.name,
    ...(series.description ? { description: series.description } : {}),
    href: toLocalePath(`/series/${series.slug}`, locale),
    meta: (
      <I18nText
        locale={locale}
        ja={`全 ${series.posts.length} 回`}
        en={`${series.posts.length} parts`}
      />
    ),
    cta: <I18nText locale={locale} ja="目次を見る →" en="View parts →" />,
  }));

  return (
    <SiteLayout locale={locale} path={pagePath}>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="page-heading">
          <div>
            <h1 className="page-title">
              <I18nText locale={locale} ja="連載" en="Series" />
            </h1>
          </div>
          <p className="page-count">
            {locale === "en"
              ? `${items.length} series`
              : `全 ${items.length} 件`}
          </p>
        </header>

        <EntryCardList
          items={items}
          emptyState={
            <p className="empty-state">
              <I18nText
                locale={locale}
                ja="まだ連載がありません。"
                en="No series yet."
              />
            </p>
          }
        />
      </main>
    </SiteLayout>
  );
}
