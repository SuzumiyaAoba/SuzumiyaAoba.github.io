import type { Locale } from "@/shared/lib/routing";
import { keywordSpecificSources } from "../model/sources";

export function KeywordReference({
  locale,
  source,
  slug,
}: {
  locale: Locale;
  source: { title: string; url: string };
  slug: string;
}) {
  return (
    <section aria-labelledby="source-heading" className="space-y-2">
      <div className="section-heading">
        <h2 id="source-heading" className="section-title">
          {locale === "ja" ? "参考資料" : "References"}
        </h2>
      </div>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="arrow-link"
      >
        {source.title} ↗
      </a>
      {keywordSpecificSources[slug] ? null : (
        <p className="text-xs text-muted-foreground">
          {locale === "ja"
            ? "分野全体の資料で、この項目を直接扱っているとは限りません。"
            : "A general reference for this subcategory."}
        </p>
      )}
    </section>
  );
}
