import Image from "next/image";
import { Icon } from "@iconify/react";

import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { getSeriesList } from "@/entities/series-item";
import { Card } from "@/shared/ui/card";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";
import { resolveThumbnail } from "@/shared/lib/thumbnail";

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const seriesList = await getSeriesList(resolvedLocale);
  const pagePath = toLocalePath("/series", resolvedLocale);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: "Series", path: pagePath },
        ])}
      />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={resolvedLocale} ja="シリーズ" en="Series" />
          </h1>
        </section>

        {seriesList.length === 0 ? (
          <Card className="border-transparent bg-card/40 shadow-none">
            <div className="px-5 py-6 text-sm text-muted-foreground">
              <I18nText
                locale={resolvedLocale}
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
                  <Card className="group border-transparent bg-card/50 shadow-none transition-colors hover:bg-card/70">
                    <a
                      href={toLocalePath(`/series/${series.slug}`, resolvedLocale)}
                      className="flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-stretch md:gap-6"
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
                            locale={resolvedLocale}
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
      <Footer locale={resolvedLocale} />
    </div>
  );
}
