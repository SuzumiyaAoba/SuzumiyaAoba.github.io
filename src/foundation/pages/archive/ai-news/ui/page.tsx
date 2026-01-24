import { getAiNewsEntries, getAiNewsUpdated } from "@/shared/lib/ai-news";
import { renderMdx } from "@/shared/lib/mdx";
import { type Locale } from "@/shared/lib/routing";
import { AiNewsPageContent } from "./page-content";

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
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
    <AiNewsPageContent
      locale={resolvedLocale}
      updated={updated ?? null}
      entries={renderedEntries}
    />
  );
}
