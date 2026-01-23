import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList } from "@/shared/lib/breadcrumbs";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/locale-path";
import { getAiNewsEntries, getAiNewsUpdated } from "@/shared/lib/ai-news";
import { renderMdx } from "@/shared/lib/mdx";
import { Tag } from "@/shared/ui/tag";
import { Icon } from "@iconify/react";

type PageProps = {
  locale?: Locale;
};

function resolveTimelineIcon(tags?: string[]): string | null {
  if (!tags || tags.length === 0) {
    return null;
  }

  const normalized = tags.map((tag) => tag.toLowerCase());
  if (normalized.includes("openai")) {
    return "logos:openai-icon";
  }
  if (normalized.includes("anthropic") || normalized.includes("ahthropic")) {
    return "material-icon-theme:claude";
  }
  if (normalized.includes("deepseek")) {
    return "ri:deepseek-fill";
  }
  if (normalized.includes("gemini")) {
    return "ri:gemini-fill";
  }
  return null;
}

export default async function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const pagePath = toLocalePath("/archive/ai-news", resolvedLocale);
  const pageName = resolvedLocale === "en" ? "AI News" : "AIニュース";
  const archiveName = resolvedLocale === "en" ? "Archive" : "アーカイブ";
  const [entries, updated] = await Promise.all([getAiNewsEntries(), getAiNewsUpdated()]);
  const renderedEntries = await Promise.all(
    entries.map(async (entry) => {
      const title = resolvedLocale === "en" ? (entry.title.en ?? entry.title.ja) : entry.title.ja;
      const summary =
        resolvedLocale === "en" ? (entry.summary.en ?? entry.summary.ja) : entry.summary.ja;
      const content = await renderMdx(summary);
      return {
        entry,
        title,
        summary: content,
      };
    }),
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={resolvedLocale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", resolvedLocale) },
          { name: archiveName, path: toLocalePath("/archive", resolvedLocale) },
          { name: pageName, path: pagePath },
        ])}
      />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <Breadcrumbs
          items={[
            { name: "Home", path: toLocalePath("/", resolvedLocale) },
            { name: archiveName, path: toLocalePath("/archive", resolvedLocale) },
            { name: pageName, path: pagePath },
          ]}
          className="mb-4"
        />
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={resolvedLocale} ja="ツール" en="Tools" />
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{pageName}</h1>
          {updated ? (
            <p className="text-xs text-muted-foreground">
              <I18nText locale={resolvedLocale} ja="更新" en="Updated" />: {updated}
            </p>
          ) : null}
        </section>

        <section className="mt-8">
          {renderedEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <I18nText locale={resolvedLocale} ja="ニュースデータがありません。" en="No data." />
            </p>
          ) : (
            <div className="space-y-10 border-l border-muted-foreground/20 pl-6">
              {renderedEntries.map(({ entry, title, summary }, index) => {
                const dateParts = entry.date ? entry.date.split("-") : [];
                const yearLabel = dateParts[0] ?? String(entry.year);
                const monthDayLabel =
                  dateParts.length >= 2
                    ? `${dateParts[1]}${dateParts[2] ? `.${dateParts[2]}` : ""}`
                    : "";
                const previousYear = renderedEntries[index - 1]?.entry.year ?? null;
                const showYear = previousYear !== entry.year;
                const timelineIcon = resolveTimelineIcon(entry.tags);
                return (
                  <div key={`${entry.year}-${title}`} className="space-y-4">
                    {showYear ? (
                      <div className="relative">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent" />
                        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 py-0.5 text-xs font-semibold tracking-[0.28em] text-muted-foreground">
                          {yearLabel}
                        </div>
                      </div>
                    ) : null}
                    <article className="relative">
                      {timelineIcon ? (
                        <span className="absolute -left-[34px] top-4 inline-flex h-5 w-5 items-center justify-center rounded-full bg-background text-muted-foreground">
                          <Icon icon={timelineIcon} className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      ) : (
                        <span className="absolute -left-[28.5px] top-5 h-2 w-2 rounded-full bg-muted-foreground/40" />
                      )}
                      <div className="grid gap-4 sm:grid-cols-[7.5rem_1fr] sm:items-start">
                        <div className="px-1 py-2 text-right">
                          <p className="text-lg font-semibold tracking-[0.2em] text-muted-foreground">
                            {monthDayLabel || "--.--"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-base font-semibold text-foreground">{title}</h2>
                          <div className="prose prose-sm max-w-none font-sans text-muted-foreground">
                            {summary}
                          </div>
                          {entry.tags && entry.tags.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {entry.tags.map((tag) => (
                                <Tag
                                  key={tag}
                                  tag={tag}
                                  variant="outline"
                                  className="border-muted-foreground/20 bg-transparent text-[11px] text-muted-foreground"
                                  iconClassName="text-muted-foreground"
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer locale={resolvedLocale} />
    </div>
  );
}
