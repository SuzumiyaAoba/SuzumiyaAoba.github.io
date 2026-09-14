import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList, toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import type { RenderedRelease } from "../model/release-calendar";
import { ReleaseExplorer } from "./release-explorer";

export type AiNewsPageContentProps = {
  locale: Locale;
  updated: string | null;
  entries: RenderedRelease[];
  today?: string;
};

export function AiNewsPageContent({ locale, updated, entries, today }: AiNewsPageContentProps) {
  const en = locale === "en";
  const pagePath = toLocalePath("/archive/ai-news", locale);
  const breadcrumbs = [
    { name: "Home", path: toLocalePath("/", locale) },
    { name: en ? "Archive" : "アーカイブ", path: toLocalePath("/archive", locale) },
    { name: en ? "AI News" : "AIニュース", path: pagePath },
  ];

  return (
    <div className="site-page @container">
      <Header locale={locale} path={pagePath} />
      <JsonLd data={buildBreadcrumbList(breadcrumbs)} />
      <main className="site-main min-w-0 font-noto bg-muted/20">
        <div className="page-stack min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Breadcrumbs items={breadcrumbs} />
            <a
              href={toLocalePath("/archive/ai-news/timeline", locale)}
              className="inline-flex min-h-10 items-center text-xs text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
            >
              {en ? "Original timeline ↗" : "従来のタイムライン ↗"}
            </a>
          </div>
          <section className="page-heading">
            <h1 className="page-title">
              {en ? "AI model release comparison" : "AIモデルのリリース比較"}
            </h1>
            {updated && (
              <p className="text-xs text-muted-foreground">
                {en ? "Updated" : "最終更新"}: <time dateTime={updated}>{updated}</time>
              </p>
            )}
          </section>
          <ReleaseExplorer entries={entries} locale={locale} {...(today ? { today } : {})} />
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
