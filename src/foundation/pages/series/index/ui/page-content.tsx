import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { Card } from "@/shared/ui/card";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import { EntryCardList, type EntryCardItem } from "@/shared/ui/entry-card-list";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  toLocalePath,
  type Locale,
} from "@/shared/lib/routing";
import { SeriesDefinition } from "@/entities/series-item";

export type SeriesListPageContentProps = {
  locale: Locale;
  seriesList: SeriesDefinition[];
};

export function SeriesListPageContent({ locale, seriesList }: SeriesListPageContentProps) {
  const pagePath = toLocalePath("/series", locale);
  const breadcrumbItems = buildListBreadcrumbItems(locale, { name: "Series", path: "/series" });

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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <Breadcrumbs items={breadcrumbItems} />
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={locale} ja="シリーズ" en="Series" />
          </h1>
        </section>

        <EntryCardList
          items={items}
          emptyState={
            <Card className="border-transparent bg-card/40 shadow-none">
              <div className="px-5 py-6 text-sm text-muted-foreground">
                <I18nText locale={locale} ja="まだシリーズがありません。" en="No series yet." />
              </div>
            </Card>
          }
        />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
