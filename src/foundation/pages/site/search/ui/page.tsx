import { Suspense } from "react";
import Script from "next/script";
import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";

import { SearchPanel } from "./search-panel";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";

function SearchLoading() {
  return (
    <div className="px-4 py-6 text-sm text-muted-foreground">検索機能を読み込み中...</div>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Script src="/pagefind-adapter.js" strategy="afterInteractive" />
      <Header />
      <JsonLd data={buildBreadcrumbList([{ name: "Home", path: "/" }, { name: "Search", path: "/search" }])} />
      <main className="mx-auto flex-1 flex w-full max-w-6xl flex-col gap-8 px-4 pt-6 pb-10 sm:gap-10 sm:px-6 sm:pt-8 sm:pb-12">
        <section className="space-y-3">
          <h1 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            SEARCH
          </h1>
          <p className="text-sm text-muted-foreground">
            記事・シリーズ・ツールなどをキーワードで検索できます。
          </p>
        </section>
        <Suspense fallback={<SearchLoading />}>
          <SearchPanel />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
