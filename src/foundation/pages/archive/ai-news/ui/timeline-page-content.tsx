import { SiteLayout } from "@/widgets/site-layout";
import { buildBreadcrumbList, toLocalePath } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { Breadcrumbs } from "@/shared/ui/breadcrumbs";
import { I18nText } from "@/shared/ui/i18n-text";
import type { AiNewsPageContentProps } from "./page-content";
import { Tag } from "@/shared/ui/tag";
import { Icon } from "@/shared/ui/icon";

function resolveTimelineIcon(tags?: string[]): string | null {
  if (!tags || tags.length === 0) {
    return null;
  }

  const normalized = new Set(tags.map((tag) => tag.toLowerCase()));
  if (
    normalized.has("openai") ||
    normalized.has("codex") ||
    normalized.has("gpt")
  ) {
    return "logos:openai-icon";
  }
  if (
    normalized.has("anthropic") ||
    normalized.has("ahthropic") ||
    normalized.has("claude") ||
    normalized.has("claude opus") ||
    normalized.has("claude sonnet") ||
    normalized.has("claude haiku")
  ) {
    return "material-icon-theme:claude";
  }
  if (normalized.has("deepseek")) {
    return "ri:deepseek-fill";
  }
  if (normalized.has("gemini")) {
    return "material-icon-theme:gemini-ai";
  }
  if (normalized.has("nano banana") || normalized.has("nao banana")) {
    return "lucide:banana";
  }
  return null;
}

export function AiNewsTimelinePageContent({
  locale,
  updated,
  entries,
}: AiNewsPageContentProps) {
  const pagePath = toLocalePath("/archive/ai-news/timeline", locale);
  const pageName = locale === "en" ? "AI News" : "AIニュース";
  const archiveName = locale === "en" ? "Archive" : "アーカイブ";

  return (
    <SiteLayout locale={locale} path={pagePath}>
      <JsonLd
        data={buildBreadcrumbList([
          { name: "Home", path: toLocalePath("/", locale) },
          { name: archiveName, path: toLocalePath("/archive", locale) },
          { name: pageName, path: pagePath },
        ])}
      />
      <main className="site-main page-stack">
        <Breadcrumbs
          items={[
            { name: "Home", path: toLocalePath("/", locale) },
            { name: archiveName, path: toLocalePath("/archive", locale) },
            { name: pageName, path: pagePath },
          ]}
        />
        <section className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            <I18nText locale={locale} ja="ツール" en="Tools" />
          </p>
          <h1 className="text-2xl leading-snug font-semibold tracking-tight sm:text-3xl">
            {pageName}
          </h1>
          {updated ? (
            <p className="text-xs text-muted-foreground">
              <I18nText locale={locale} ja="更新" en="Updated" />: {updated}
            </p>
          ) : null}
          <p className="text-sm">
            <a
              href={toLocalePath("/archive/ai-news", locale)}
              className="inline-block py-2 underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              <I18nText
                locale={locale}
                ja="カレンダー・リリース間隔を見る →"
                en="View calendar and release intervals →"
              />
            </a>
          </p>
        </section>

        <section>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              <I18nText
                locale={locale}
                ja="ニュースデータがありません。"
                en="No data."
              />
            </p>
          ) : (
            <div className="relative space-y-6">
              <span className="pointer-events-none absolute top-0 left-[9.5rem] hidden h-full w-px bg-muted-foreground/20 sm:block" />
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
                              <Icon
                                icon={timelineIcon}
                                className="h-5 w-5"
                                aria-hidden
                              />
                            </span>
                          ) : (
                            <span className="relative z-10 mt-4 h-2 w-2 rounded-full bg-muted-foreground/40" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-base font-semibold text-foreground">
                            {title}
                          </h2>
                          <div className="prose max-w-none font-serif text-muted-foreground">
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
    </SiteLayout>
  );
}
