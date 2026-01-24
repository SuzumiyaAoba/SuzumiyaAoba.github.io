import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";
import { buildBreadcrumbList, toLocalePath, type Locale } from "@/shared/lib/routing";
import { SeriesDefinition } from "@/entities/series-item";

export type SeriesDetailPageContentProps = {
  locale: Locale;
  series: SeriesDefinition;
  entries: {
    slug: string;
    title: string;
    date?: string;
    tags: string[];
  }[];
};

export function SeriesDetailPageContent({ locale, series, entries }: SeriesDetailPageContentProps) {
  const pagePath = toLocalePath(`/series/${series.slug}`, locale);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Series", path: toLocalePath("/series", locale) },
          { name: series.name, path: pagePath },
        ])}
      />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <Breadcrumbs
          items={[
            { name: "Home", path: toLocalePath("/", locale) },
            { name: "Series", path: toLocalePath("/series", locale) },
            { name: series.name, path: pagePath },
          ]}
          className="mb-2"
        />
        <section className="space-y-3">
          <a
            href={toLocalePath("/series", locale)}
            className="text-xs font-medium text-muted-foreground"
          >
            <I18nText locale={locale} ja="← シリーズ一覧" en="← Back to series" />
          </a>
          <h1 className="text-3xl font-semibold">{series.name}</h1>
          {series.description ? (
            <p className="text-sm leading-6 text-muted-foreground">{series.description}</p>
          ) : null}
        </section>

        {entries.length === 0 ? (
          <Card className="border-transparent bg-card/40 shadow-none">
            <div className="px-5 py-6 text-sm text-muted-foreground">
              <I18nText locale={locale} ja="まだ記事がありません。" en="No posts yet." />
            </div>
          </Card>
        ) : (
          <ul className="space-y-4">
            {entries.map((post) => (
              <li key={`${locale}-${post.slug}`}>
                <Card className="group relative border-transparent bg-card/40 shadow-none transition-colors hover:bg-muted/20">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-1 rounded-[18px] bg-muted/30 opacity-0 transition duration-200 ease-out scale-95 group-hover:opacity-100 group-hover:scale-100"
                  />
                  <a
                    href={toLocalePath(`/blog/post/${post.slug}`, locale)}
                    className="relative z-10 flex flex-col gap-3 px-5 py-5"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{post.date}</span>
                      <Badge
                        variant="secondary"
                        className="bg-muted/70 text-[11px] text-muted-foreground"
                      >
                        {series.name}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-foreground">{post.title}</p>
                      {post.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <Tag
                              key={`${locale}-${tag}`}
                              tag={tag}
                              className="bg-muted text-[11px] font-medium text-muted-foreground"
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </a>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
