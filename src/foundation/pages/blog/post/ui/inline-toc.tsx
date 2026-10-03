import { I18nText } from "@/shared/ui/i18n-text";
import type { TocHeading } from "@/shared/lib/mdx";
import type { Locale } from "@/shared/lib/routing";

type InlineTocProps = {
  headings: TocHeading[];
  locale: Locale;
};

/** 目次を余白に置けない画面幅で、本文の前に折りたたんで置く目次。 */
export function InlineToc({ headings, locale }: InlineTocProps) {
  if (headings.length === 0) {
    return null;
  }

  return (
    <details className="article-toc-inline">
      <summary>
        <I18nText locale={locale} ja="目次" en="Contents" />
        <span className="article-toc-inline-count">
          <I18nText
            locale={locale}
            ja={`${headings.length} 項目`}
            en={`${headings.length} sections`}
          />
        </span>
      </summary>
      <ol>
        {headings.map((heading) => (
          <li key={heading.id} data-level={heading.level}>
            <a href={`#${heading.id}`}>{heading.text}</a>
          </li>
        ))}
      </ol>
    </details>
  );
}
