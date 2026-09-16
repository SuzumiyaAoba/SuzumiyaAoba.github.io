import { SiteLayout } from "@/widgets/site-layout";

import { Card } from "@/shared/ui/card";
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
    ...(series.thumbnail ? { thumbnail: series.thumbnail } : {}),
    thumbnailBasePath: `/contents/series/${series.slug}`,
    href: toLocalePath(`/series/${series.slug}`, locale),
    cta: (
      <I18nText
        locale={locale}
        ja={`${series.posts.length} 件 →`}
        en={`${series.posts.length} posts →`}
      />
    ),
  }));

  return (
    <SiteLayout locale={locale} path={pagePath}>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbItems} />
        <section className="page-heading">
          <h1 className="page-title">
            <I18nText locale={locale} ja="シリーズ" en="Series" />
          </h1>
          <p className="page-count">
            {locale === "en" ? `${items.length} series` : `${items.length} 件`}
          </p>
        </section>

        <EntryCardList
          items={items}
          emptyState={
            <Card variant="soft">
              <div className="px-5 py-6 text-sm text-muted-foreground">
                <I18nText
                  locale={locale}
                  ja="まだシリーズがありません。"
                  en="No series yet."
                />
              </div>
            </Card>
          }
        />
      </main>
    </SiteLayout>
  );
}
