import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList, toLocalePath, type Locale } from "@/shared/lib/routing";
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
              className="py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {en ? "Original timeline ↗" : "従来のタイムライン ↗"}
            </a>
          </div>
          <section className="space-y-3">
            {updated && (
              <p className="text-xs text-muted-foreground">
                {en ? "Updated" : "最終更新"}: <time dateTime={updated}>{updated}</time>
              </p>
            )}
            <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              {en ? "AI model release comparison" : "AIモデルのリリース比較"}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              {en
                ? "Every release, and the time until the next. Follow the pace of AI across providers, models, and years."
                : "発表日と、次のモデルまでの時間。提供元を横断して、AIの進化の流れを見渡せます。"}
            </p>
          </section>
          <ReleaseExplorer entries={entries} locale={locale} {...(today ? { today } : {})} />
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
