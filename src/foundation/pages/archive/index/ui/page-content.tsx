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
import { EntryCardList } from "@/shared/ui/entry-card-list";
import type { EntryCardItem } from "@/shared/ui/entry-card-list";

export type ArchivePageContentProps = {
  locale: Locale;
};

export function ArchivePageContent({ locale }: ArchivePageContentProps) {
  const pagePath = toLocalePath("/archive", locale);
  const breadcrumbItems = buildListBreadcrumbItems(locale, {
    name: "Archive",
    path: "/archive",
  });
  const archives = [
    {
      slug: "ai-news",
      path: "/archive/ai-news/",
      title: {
        ja: "AIニュース",
        en: "AI News",
      },
      description: {
        ja: "AIモデルのリリース日と、系列ごとのリリース間隔をカレンダーで比較。",
        en: "Explore AI model release dates and compare release intervals by series.",
      },
    },
    {
      slug: "tools",
      path: "/tools/",
      title: {
        ja: "ツール",
        en: "Tools",
      },
      description: {
        ja: "ASCII コード表や資産形成シミュレーションなどのツール集。",
        en: "A collection of tools, including an ASCII code table and an asset formation simulator.",
      },
    },
    {
      slug: "awesome-something",
      path: "/awesome-something/",
      title: {
        ja: "Awesome Something",
        en: "Awesome Something",
      },
      description: {
        ja: "開発やデザインに役立つツール・ライブラリ・資料を分野別に集めたリンク集。",
        en: "A curated collection of tools, libraries, and references for development and design.",
      },
    },
  ];

  const items: EntryCardItem[] = archives.map((archive) => ({
    slug: archive.slug,
    title: locale === "en" ? archive.title.en : archive.title.ja,
    description:
      locale === "en" ? archive.description.en : archive.description.ja,
    href: toLocalePath(archive.path, locale),
    cta: <I18nText locale={locale} ja="開く →" en="Open →" />,
  }));

  return (
    <SiteLayout locale={locale} path={pagePath}>
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbItems} />
        <header className="page-heading">
          <div>
            <h1 className="page-title">
              <I18nText locale={locale} ja="資料" en="Resources" />
            </h1>
          </div>
          <p className="page-count">
            {locale === "en"
              ? `${items.length} items`
              : `全 ${items.length} 件`}
          </p>
        </header>

        <EntryCardList
          items={items}
          emptyState={
            <p className="empty-state">
              <I18nText
                locale={locale}
                ja="項目がありません。"
                en="No archive items."
              />
            </p>
          }
        />
      </main>
    </SiteLayout>
  );
}
