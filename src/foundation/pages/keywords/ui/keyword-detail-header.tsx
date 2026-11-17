import type { Locale } from "@/shared/lib/routing";
import type { Keyword, KeywordSubcategory } from "../model/catalog";

const asSentence = (value: string) =>
  /[。.!?]$/u.test(value) ? value : `${value}。`;

export function KeywordDetailHeader({
  locale,
  subcategory,
  displayName,
  keyword,
  index,
}: {
  locale: Locale;
  subcategory: KeywordSubcategory;
  displayName: string;
  keyword: Keyword;
  index: number;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="page-eyebrow">
          {locale === "ja" ? subcategory.name : subcategory.english}
        </p>
        <div className="keyword-title">
          <h1 className="page-title">{displayName}</h1>
          <p
            className="keyword-title-gloss"
            lang={locale === "ja" ? "en" : "ja"}
          >
            {locale === "ja" ? keyword.english : keyword.name}
          </p>
        </div>
        <p className="keyword-effect" lang="ja">
          {asSentence(keyword.effect)}
        </p>
      </div>
      <p className="page-count">
        {index + 1} / {subcategory.keywords.length}
      </p>
    </header>
  );
}
