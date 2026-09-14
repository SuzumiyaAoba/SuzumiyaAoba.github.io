import { Suspense } from "react";
import Script from "next/script";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { SearchPanel } from "./search-panel";
import {
  buildBreadcrumbList,
  buildListBreadcrumbItems,
  toLocalePath,
  resolveLocale,
} from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";

function SearchLoading({ locale }: { locale: Locale }) {
  return (
    <div className="px-4 py-6 text-sm text-muted-foreground">
      <I18nText locale={locale} ja="検索機能を読み込み中..." en="Loading search..." />
    </div>
  );
}

type PageProps = {
  locale?: Locale;
};

export type SearchPageContentProps = {
  locale: Locale;
};

export function SearchPageContent({ locale }: SearchPageContentProps) {
  const pagePath = toLocalePath("/search", locale);
  const breadcrumbItems = buildListBreadcrumbItems(locale, { name: "Search", path: "/search" });
  return (
    <div className="site-page">
      <Script src="/pagefind-adapter.js" strategy="afterInteractive" />
      <Header locale={locale} path={pagePath} />
      <JsonLd data={buildBreadcrumbList(breadcrumbItems)} />
      <main className="site-main page-stack">
        <Breadcrumbs items={breadcrumbItems} />
        <section className="page-heading">
          <h1 className="page-title">
            <I18nText locale={locale} ja="検索" en="Search" />
          </h1>
        </section>
        <Suspense fallback={<SearchLoading locale={locale} />}>
          <SearchPanel locale={locale} />
        </Suspense>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

export default function Page({ locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  return <SearchPageContent locale={resolvedLocale} />;
}
