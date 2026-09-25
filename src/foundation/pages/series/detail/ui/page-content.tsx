import { SiteLayout } from "@/widgets/site-layout";
import { BackLink } from "@/shared/ui/back-link";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";
import {
  buildBreadcrumbList,
  buildDetailBreadcrumbItems,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { SeriesDefinition } from "@/entities/series-item";

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

  return (
    <SiteLayout locale={locale} path={pagePath}>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbItems} />
        <section className="space-y-3">
          <BackLink
            locale={locale}
            href="/series"
            ja="← シリーズ一覧"
            en="← Back to series"
          />
          <h1 className="text-2xl leading-snug font-semibold sm:text-3xl">
            {series.name}
          </h1>
        </section>

        {entries.length === 0 ? (
          <Card variant="soft">
            <div className="px-5 py-6 text-sm text-muted-foreground">
              <I18nText
                locale={locale}
                ja="まだ記事がありません。"
                en="No posts yet."
              />
            </div>
          </Card>
        ) : (
          <ul className="space-y-3">
            {entries.map((post) => (
              <li key={`${locale}-${post.slug}`}>
                <Card variant="interactive" className="group relative">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-1 scale-95 rounded-3xl bg-muted/30 opacity-0 transition duration-200 ease-out group-hover:scale-100 group-hover:opacity-100"
                  />
                  <a
                    href={toLocalePath(`/blog/post/${post.slug}`, locale)}
                    className="relative z-10 flex flex-col gap-2 px-5 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{post.date}</span>
                      <Badge variant="muted">{series.name}</Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-foreground">
                        {post.title}
                      </p>
                      {post.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <Tag
                              key={`${locale}-${tag}`}
                              tag={tag}
                              variant="muted"
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
    </SiteLayout>
  );
}
