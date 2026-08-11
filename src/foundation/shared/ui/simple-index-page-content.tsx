import { buildBreadcrumbList, buildListBreadcrumbItems, type Locale } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import { Card } from "@/shared/ui/card";
import { SimpleEntryList, type SimpleEntryListItem } from "@/shared/ui/simple-entry-list";

type LocalizedText = { ja: string; en: string };

export type SimpleIndexPageContentProps = {
  locale: Locale;
  /** ロケール非依存のパス(例: "/books") */
  path: string;
  /** パンくずの表示名(例: "Books") */
  breadcrumbName: string;
  heading: LocalizedText;
  description?: LocalizedText;
  emptyMessage: LocalizedText;
  items: SimpleEntryListItem[];
};

/**
 * 見出し・説明文・空メッセージ以外はレイアウトが同一な一覧ページの共通テンプレート。
 * books/index, notes/index のような単純な一覧ページで利用する。
 * Header/Footer はページ側の責務のため含まない。
 */
export function SimpleIndexPageContent({
  locale,
  path,
  breadcrumbName,
  heading,
  description,
  emptyMessage,
  items,
}: SimpleIndexPageContentProps) {
  const breadcrumbItems = buildListBreadcrumbItems(locale, { name: breadcrumbName, path });
  return (
    <>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main flex flex-col gap-8 sm:gap-10">
        <Breadcrumbs items={breadcrumbItems} />
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={locale} ja={heading.ja} en={heading.en} />
          </h1>
          {description && (
            <div className="max-w-3xl space-y-3">
              <p className="text-sm leading-7 text-muted-foreground">
                <I18nText locale={locale} ja={description?.ja} en={description?.en} />
              </p>
            </div>
          )}
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
