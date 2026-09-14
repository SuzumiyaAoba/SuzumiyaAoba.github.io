import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { Card } from "@/shared/ui/card";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";
import { buildBreadcrumbList, buildListBreadcrumbItems, toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";

export type TagEntry = {
  name: string;
  count: number;
};

export type TagsListPageContentProps = {
  locale: Locale;
  tags: TagEntry[];
};

export function TagsListPageContent({ locale, tags }: TagsListPageContentProps) {
  const pagePath = toLocalePath("/tags", locale);
  const breadcrumbItems = buildListBreadcrumbItems(locale, { name: "Tags", path: "/tags" });

  return (
    <div className="site-page">
      <Header locale={locale} path={pagePath} />
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack" data-pagefind-ignore="all">
        <Breadcrumbs items={breadcrumbItems} />
        <section className="page-heading">
          <h1 className="page-title">
            <I18nText locale={locale} ja="タグ" en="Tags" />
          </h1>
          <p className="page-count">
            {locale === "en" ? `${tags.length} tags` : `${tags.length} 件`}
          </p>
        </section>

        {tags.length === 0 ? (
          <Card className="border-transparent bg-card/40 shadow-none">
            <div className="px-5 py-6 text-sm text-muted-foreground">
              <I18nText locale={locale} ja="タグがまだありません。" en="No tags yet." />
            </div>
          </Card>
        ) : (
          <ul className="tag-index grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <li key={`${locale}-${tag.name}`}>
                <a
                  href={toLocalePath(`/tags/${encodeURIComponent(tag.name)}`, locale)}
                  className="index-link flex min-h-14 items-center justify-between gap-3 px-1 py-3"
                >
                  <Tag
                    tag={tag.name}
                    className="min-w-0 whitespace-normal border-0 bg-transparent p-0 text-sm font-medium text-inherit"
                  />
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                    {tag.count}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
