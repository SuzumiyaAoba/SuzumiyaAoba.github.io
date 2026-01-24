import Image from "next/image";
import { Icon } from "@iconify/react";

import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { Card } from "@/shared/ui/card";
import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { buildBreadcrumbList, toLocalePath, type Locale } from "@/shared/lib/routing";
import { resolveThumbnail } from "@/shared/lib/thumbnail";
import { SeriesDefinition } from "@/entities/series-item";

export type SeriesListPageContentProps = {
  locale: Locale;
  seriesList: SeriesDefinition[];
};

export function SeriesListPageContent({ locale, seriesList }: SeriesListPageContentProps) {
  const pagePath = toLocalePath("/series", locale);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Series", path: pagePath },
        ])}
      />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={locale} ja="シリーズ" en="Series" />
          </h1>
        </section>

        {seriesList.length === 0 ? (
          <Card className="border-transparent bg-card/40 shadow-none">
            <div className="px-5 py-6 text-sm text-muted-foreground">
              <I18nText
                locale={locale}
                ja="まだシリーズがありません。"
                en="No series yet."
              />
            </div>
          </Card>
        ) : (
          <ul className="space-y-4">
            {seriesList.map((series) => {
              const thumbnail = resolveThumbnail(series.slug, series.thumbnail, {
                basePath: `/contents/series/${series.slug}`,
              });
              const isFallback = thumbnail.type === "image" && thumbnail.isFallback;

              return (
                <li key={series.slug}>
                  <Card className="group relative border-transparent bg-card/50 shadow-none transition-colors hover:bg-muted/30">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -inset-1 rounded-[18px] bg-muted/40 opacity-0 transition duration-200 ease-out scale-95 group-hover:opacity-100 group-hover:scale-100"
                    />
                    <a
                      href={toLocalePath(`/series/${series.slug}`, locale)}
                      className="relative z-10 flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-stretch md:gap-6"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-muted bg-muted md:w-44">
                        {thumbnail.type === "image" ? (
                          <Image
                            src={thumbnail.src}
                            alt={isFallback ? "Site icon" : series.name}
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
                            <span className="sr-only">{series.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 py-2">
                        <div className="space-y-2">
                          <div className="text-lg font-semibold text-foreground">{series.name}</div>
                          {series.description ? (
                            <p className="text-sm leading-6 text-muted-foreground">
                              {series.description}
                            </p>
                          ) : null}
                        </div>
                        <span className="text-xs font-medium text-muted-foreground md:mt-auto">
                          <I18nText
                            locale={locale}
                            ja={`${series.posts.length} 件 →`}
                            en={`${series.posts.length} posts →`}
                          />
                        </span>
                      </div>
                    </a>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
