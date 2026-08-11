import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  toLocalePath,
  type Locale,
} from "@/shared/lib/routing";
import { Card } from "@/shared/ui/card";
import { EntryCardList, type EntryCardItem } from "@/shared/ui/entry-card-list";

export type ArchivePageContentProps = {
  locale: Locale;
};

export function ArchivePageContent({ locale }: ArchivePageContentProps) {
  const pagePath = toLocalePath("/archive", locale);
  const breadcrumbItems = buildListBreadcrumbItems(locale, { name: "Archive", path: "/archive" });
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

  const items: EntryCardItem[] = archives.map((archive) => ({
    slug: archive.slug,
    title: locale === "en" ? archive.title.en : archive.title.ja,
    description: locale === "en" ? archive.description.en : archive.description.ja,
    thumbnail: archive.thumbnail,
    thumbnailBasePath: `/contents/archive/${archive.slug}`,
    href: toLocalePath(`/archive/${archive.slug}/`, locale),
    cta: <I18nText locale={locale} ja="開く →" en="Open →" />,
  }));

  return (
    <div className="site-page">
      <Header locale={locale} path={pagePath} />
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main flex flex-col gap-8 sm:gap-10">
        <Breadcrumbs items={breadcrumbItems} />
        <section className="space-y-4">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={locale} ja="アーカイブ" en="Archive" />
          </h1>
        </section>

        <EntryCardList
          items={items}
          emptyState={
            <Card className="border-transparent bg-card/40 shadow-none">
              <div className="px-5 py-6 text-sm text-muted-foreground">
                <I18nText locale={locale} ja="項目がありません。" en="No archive items." />
              </div>
            </Card>
          }
        />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
