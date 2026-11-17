import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { Keyword } from "../model/catalog";
import { keywordPath } from "./keyword-paths";

export function RelatedKeywords({
  locale,
  related,
}: {
  locale: Locale;
  related: Keyword[];
}) {
  return (
    <section aria-labelledby="related-heading">
      <div className="section-heading">
        <h2 id="related-heading" className="section-title">
          {locale === "ja" ? "関連キーワード" : "Related keywords"}
        </h2>
      </div>
      <ul className="glossary-list">
        {related.map((item) => (
          <li key={`${item.subcategoryId}/${item.slug}`}>
            <a
              href={toLocalePath(
                keywordPath(item.categoryId, item.subcategoryId, item.slug),
                locale
              )}
              className="glossary-entry"
            >
              <span className="glossary-term">
                {locale === "ja" ? item.name : item.english}
              </span>
              <span
                className="glossary-gloss"
                lang={locale === "ja" ? "en" : "ja"}
              >
                {locale === "ja" ? item.english : item.name}
              </span>
              <span className="glossary-definition">{item.effect}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
