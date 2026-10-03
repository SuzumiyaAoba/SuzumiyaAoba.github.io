"use client";

import { TOCProvider, TOCScrollArea, ClerkTOCItems } from "@/shared/ui/toc";
import { I18nText } from "@/shared/ui/i18n-text";
import type { TocHeading } from "@/shared/lib/mdx";
import type { Locale } from "@/shared/lib/routing";

type TocProps = {
  headings: TocHeading[];
  locale: Locale;
};

/** 広い画面で本文の右余白に追従する目次。読んでいる位置を示す。 */
export function Toc({ headings, locale }: TocProps) {
  if (headings.length === 0) {
    return null;
  }

  const toc = headings.map((h) => ({
    title: h.text,
    url: `#${h.id}`,
    depth: h.level,
  }));

  return (
    <TOCProvider toc={toc}>
      <nav
        className="article-toc"
        aria-label={locale === "en" ? "Table of contents" : "目次"}
      >
        <p className="shrink-0 section-label">
          <I18nText locale={locale} ja="目次" en="Contents" />
        </p>
        <TOCScrollArea className="min-h-0 flex-1">
          <ClerkTOCItems />
        </TOCScrollArea>
      </nav>
    </TOCProvider>
  );
}
