import { SiteLayout } from "@/widgets/site-layout";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  toLocalePath,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";

export type TagEntry = {
  name: string;
  count: number;
};

export type TagsListPageContentProps = {
  locale: Locale;
  tags: TagEntry[];
};

export function TagsListPageContent({
  locale,
  tags,
}: TagsListPageContentProps) {
  const pagePath = toLocalePath("/tags", locale);
  const breadcrumbItems = buildListBreadcrumbItems(locale, {
    name: "Tags",
    path: "/tags",
  });

  return (
    <SiteLayout locale={locale} path={pagePath}>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack" data-pagefind-ignore="all">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="page-heading">
          <div>
            <h1 className="page-title">
              <I18nText locale={locale} ja="タグ" en="Tags" />
            </h1>
          </div>
          <p className="page-count">
            {locale === "en" ? `${tags.length} tags` : `全 ${tags.length} 件`}
          </p>
        </header>

        {tags.length === 0 ? (
          <p className="empty-state">
            <I18nText
              locale={locale}
              ja="タグがまだありません。"
              en="No tags yet."
            />
          </p>
        ) : (
          <ul className="tag-cloud">
            {tags.map((tag) => (
              <li key={`${locale}-${tag.name}`}>
                <a
                  href={toLocalePath(
                    `/tags/${encodeURIComponent(tag.name)}`,
                    locale
                  )}
                  className="topic-chip"
                >
                  {tag.name}
                  <span className="topic-chip-count">{tag.count}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </SiteLayout>
  );
}
