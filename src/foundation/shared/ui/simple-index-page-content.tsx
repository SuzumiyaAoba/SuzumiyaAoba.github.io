import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
} from "@/shared/lib/routing";
import type { BreadcrumbItem, Locale } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
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
  breadcrumbItems = buildListBreadcrumbItems(locale, {
    name: breadcrumbName,
    path,
  }),
  heading,
  emptyMessage,
  items,
}: SimpleIndexPageContentProps) {
  return (
    <>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="page-heading">
          <div>
            <h1 className="page-title">
              <I18nText locale={locale} ja={heading.ja} en={heading.en} />
            </h1>
          </div>
          <p className="page-count">
            {locale === "en"
              ? `${items.length} items`
              : `全 ${items.length} 件`}
          </p>
        </header>

        <SimpleEntryList
          items={items}
          emptyState={
            <p className="empty-state">
              <I18nText
                locale={locale}
                ja={emptyMessage.ja}
                en={emptyMessage.en}
              />
            </p>
          }
        />
      </main>
    </>
  );
}
