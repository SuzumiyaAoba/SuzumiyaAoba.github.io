import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { Card } from "@/shared/ui/card";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { Tag } from "@/shared/ui/tag";
import { I18nText } from "@/shared/ui/i18n-text";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  toLocalePath,
  type Locale,
} from "@/shared/lib/routing";

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
      <main className="site-main flex flex-col gap-8 sm:gap-10" data-pagefind-ignore="all">
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
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => (
              <li key={`${locale}-${tag.name}`}>
                <Card className="border-0 bg-muted/60 shadow-none transition-colors hover:bg-accent">
                  <a
                    href={toLocalePath(`/tags/${encodeURIComponent(tag.name)}`, locale)}
                    className="flex min-h-18 items-center justify-between gap-4 rounded-xl px-5 py-4"
                  >
                    <Tag
                      tag={tag.name}
                      className="min-w-0 whitespace-normal border-0 bg-transparent p-0 text-sm font-medium text-foreground"
                    />
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {tag.count}
                    </span>
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
