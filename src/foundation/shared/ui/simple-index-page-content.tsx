import { buildBreadcrumbList, buildListBreadcrumbItems } from "@/shared/lib/routing";
import type { BreadcrumbItem, Locale } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import { Card } from "@/shared/ui/card";
import { SimpleEntryList } from "@/shared/ui/simple-entry-list";
import type { SimpleEntryListItem } from "@/shared/ui/simple-entry-list";

type LocalizedText = { ja: string; en: string };

export type SimpleIndexPageContentProps = {
  locale: Locale;
  /** ロケール非依存のパス(例: "/books") */
  path: string;
  /** パンくずの表示名(例: "Books") */
  breadcrumbName: string;
  /** 階層のある一覧ページで使う、ロケール適用済みのパンくず項目 */
  breadcrumbItems?: BreadcrumbItem[];
  heading: LocalizedText;
  emptyMessage: LocalizedText;
  items: SimpleEntryListItem[];
};

/**
 * 見出し・件数・空メッセージを持つ一覧ページの共通テンプレート。
 * books/index, notes/index のような単純な一覧ページで利用する。
 * Header/Footer はページ側の責務のため含まない。
 */
export function SimpleIndexPageContent({
  locale,
  path,
  breadcrumbName,
  breadcrumbItems = buildListBreadcrumbItems(locale, { name: breadcrumbName, path }),
  heading,
  emptyMessage,
  items,
}: SimpleIndexPageContentProps) {
  return (
    <>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbItems} />
        <section className="page-heading">
          <h1 className="page-title">
            <I18nText locale={locale} ja={heading.ja} en={heading.en} />
          </h1>
          <p className="page-count">
            {locale === "en" ? `${items.length} items` : `${items.length} 件`}
          </p>
        </section>

        <SimpleEntryList
          items={items}
          emptyState={
            <Card className="border-transparent bg-card/40 shadow-none">
              <div className="px-5 py-6 text-sm text-muted-foreground">
                <I18nText locale={locale} ja={emptyMessage.ja} en={emptyMessage.en} />
              </div>
            </Card>
          }
        />
      </main>
    </>
  );
}
