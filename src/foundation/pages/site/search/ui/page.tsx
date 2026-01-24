import { Suspense } from "react";
import Script from "next/script";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { SearchPanel } from "./search-panel";
import { buildBreadcrumbList } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/routing";

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
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Script src="/pagefind-adapter.js" strategy="afterInteractive" />
      <Header locale={locale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: "Search", path: pagePath },
        ])}
      />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-3">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={locale} ja="検索" en="Search" />
          </h1>
          <p className="text-sm text-muted-foreground">
            <I18nText
              locale={locale}
              ja="記事・シリーズ・ツールなどをキーワードで検索できます。"
              en="Search posts, series, tools, and more by keyword."
            />
          </p>
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
  const resolvedLocale: Locale = locale ?? "ja";
  return <SearchPageContent locale={resolvedLocale} />;
}
