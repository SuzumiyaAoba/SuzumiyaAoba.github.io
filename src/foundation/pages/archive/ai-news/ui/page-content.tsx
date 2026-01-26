import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { buildBreadcrumbList } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { ReactElement } from "react";
import { AiNewsEntry } from "@/shared/lib/ai-news";
import { Tag } from "@/shared/ui/tag";
import { Icon } from "@iconify/react";

function resolveTimelineIcon(tags?: string[]): string | null {
  if (!tags || tags.length === 0) {
    return null;
  }

  const normalized = tags.map((tag) => tag.toLowerCase());
  if (normalized.includes("openai") || normalized.includes("codex") || normalized.includes("gpt")) {
    return "logos:openai-icon";
  }
  if (
    normalized.includes("anthropic") ||
    normalized.includes("ahthropic") ||
    normalized.includes("claude") ||
    normalized.includes("claude opus") ||
    normalized.includes("claude sonnet") ||
    normalized.includes("claude hike")
  ) {
    return "material-icon-theme:claude";
  }
  if (normalized.includes("deepseek")) {
    return "ri:deepseek-fill";
  }
  if (normalized.includes("gemini")) {
    return "material-icon-theme:gemini-ai";
  }
  if (normalized.includes("nano banana") || normalized.includes("nao banana")) {
    return "lucide:banana";
  }
  return null;
}

export type AiNewsPageContentProps = {
  locale: Locale;
  updated: string | null;
  entries: {
    entry: AiNewsEntry;
    title: string;
    summary: ReactElement | string; // Allow string for Storybook mock simplicity
  }[];
};

export function AiNewsPageContent({ locale, updated, entries }: AiNewsPageContentProps) {
  const pagePath = toLocalePath("/archive/ai-news", locale);
  const pageName = locale === "en" ? "AI News" : "AIニュース";
  const archiveName = locale === "en" ? "Archive" : "アーカイブ";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header locale={locale} path={pagePath} />
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: archiveName, path: toLocalePath("/archive", locale) },
          { name: pageName, path: pagePath },
        ])}
      />
      <main className="mx-auto flex-1 w-full max-w-6xl px-4 pt-6 pb-10 sm:px-6 sm:pt-8 sm:pb-12">
        <Breadcrumbs
          items={[
            { name: "Home", path: toLocalePath("/", locale) },
            { name: archiveName, path: toLocalePath("/archive", locale) },
            { name: pageName, path: pagePath },
          ]}
          className="mb-4"
        />
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            <I18nText locale={locale} ja="ツール" en="Tools" />
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{pageName}</h1>
          {updated ? (
            <p className="text-xs text-muted-foreground">
              <I18nText locale={locale} ja="更新" en="Updated" />: {updated}
            </p>
          ) : null}
        </section>

        <section className="mt-8">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <I18nText locale={locale} ja="ニュースデータがありません。" en="No data." />
            </p>
          ) : (
            <div className="relative space-y-10">
              <span className="pointer-events-none absolute left-[9.5rem] top-0 hidden h-full w-px bg-muted-foreground/20 sm:block" />
              {entries.map(({ entry, title, summary }, index) => {
                const dateParts = entry.date ? entry.date.split("-") : [];
                const yearLabel = dateParts[0] ?? String(entry.year);
                const monthDayLabel =
                  dateParts.length >= 2
                    ? `${dateParts[1]}${dateParts[2] ? `.${dateParts[2]}` : ""}`
                    : "";
                const previousYear = entries[index - 1]?.entry.year ?? null;
                const showYear = previousYear !== entry.year;
                const timelineIcon = resolveTimelineIcon(entry.tags);
                return (
                  <div key={`${entry.year}-${title}`} className="space-y-4">
                    {showYear ? (
                      <div className="relative py-4">
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-muted-foreground/70 to-transparent" />
                        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-muted-foreground/50 bg-background px-5 py-1.5 text-sm font-semibold tracking-[0.36em] text-foreground shadow-sm">
                          {yearLabel}
                        </div>
                      </div>
                    ) : null}
                    <article>
                      <div className="grid gap-4 sm:grid-cols-[7.5rem_2rem_1fr] sm:items-start">
                        <div className="px-1 py-2 text-right">
                          <p className="text-lg font-semibold tracking-[0.2em] text-muted-foreground">
                            {monthDayLabel || "--.--"}
                          </p>
                        </div>
                        <div className="relative flex items-start justify-center self-stretch">
                          {timelineIcon ? (
                            <span className="relative z-10 mt-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background text-muted-foreground">
                              <Icon icon={timelineIcon} className="h-5 w-5" aria-hidden />
                            </span>
                          ) : (
                            <span className="relative z-10 mt-4 h-2 w-2 rounded-full bg-muted-foreground/40" />
                          )}
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
      <Footer locale={locale} />
    </div>
  );
}
