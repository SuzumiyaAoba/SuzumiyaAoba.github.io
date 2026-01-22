import Image from "next/image";
import { Icon } from "@iconify/react";

import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";
import { Card } from "@/shared/ui/card";
import { resolveThumbnail } from "@/shared/lib/thumbnail";

type PageProps = {
  locale?: Locale;
};

export default function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const pagePath = toLocalePath("/archive", resolvedLocale);
  const archives = [
    {
      slug: "ai-news",
      title: {
        ja: "AIニュース",
        en: "AI News",
      },
      description: {
        ja: "AI関連ニュースのタイムライン",
        en: "Timeline of AI-related news.",
      },
      thumbnail: "iconify:lucide:newspaper",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: "Archive", path: pagePath },
        ])}
      />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={resolvedLocale} ja="アーカイブ" en="Archive" />
          </h1>
        </section>

        <section className="mt-8">
          {archives.length === 0 ? (
            <Card className="border-transparent bg-card/40 shadow-none">
              <div className="px-5 py-6 text-sm text-muted-foreground">
                <I18nText locale={resolvedLocale} ja="項目がありません。" en="No archive items." />
              </div>
            </Card>
          ) : (
            <ul className="space-y-4">
              {archives.map((archive) => {
                const title =
                  resolvedLocale === "en" ? archive.title.en : archive.title.ja;
                const description =
                  resolvedLocale === "en"
                    ? archive.description.en
                    : archive.description.ja;
                const thumbnail = resolveThumbnail(archive.slug, archive.thumbnail, {
                  basePath: `/contents/archive/${archive.slug}`,
                });
                const isFallback = thumbnail.type === "image" && thumbnail.isFallback;
                return (
                  <li key={archive.slug}>
                    <Card className="group border-transparent bg-card/50 shadow-none transition-colors hover:bg-card/70">
                      <a
                        href={toLocalePath(`/archive/${archive.slug}/`, resolvedLocale)}
                        className="flex flex-col gap-4 px-4 py-5 sm:px-6 md:flex-row md:items-stretch md:gap-6"
                      >
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-muted bg-muted md:w-44">
                          {thumbnail.type === "image" ? (
                            <Image
                              src={thumbnail.src}
                              alt={isFallback ? "Site icon" : title}
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
                              <span className="sr-only">{title}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-2 py-2">
                          <div className="space-y-2">
                            <div className="text-lg font-semibold text-foreground">{title}</div>
                            <p className="text-sm leading-6 text-muted-foreground">
                              {description}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-muted-foreground md:mt-auto">
                            <I18nText locale={resolvedLocale} ja="開く →" en="Open →" />
                          </span>
                        </div>
                      </a>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
