import type { Metadata } from "next";
import { getSiteUrl } from "@/shared/lib/site/site-url";
import { toLocalePath, type Locale } from "@/shared/lib/routing";

const ALL_LOCALES: Locale[] = ["ja", "en"];

export type LocaleAvailability = Partial<Record<Locale, boolean>>;

export type BuildLocaleAlternatesOptions = {
  /** ja/en それぞれの実体有無。省略時は両方存在するとみなす(構造的に対称なページ向け) */
  availability?: LocaleAvailability;
  /** canonical に使うロケール。省略時は現在のロケール自身 */
  canonicalLocale?: Locale;
};

/**
 * ja/en 間の相互参照 (hreflang) と canonical をまとめて組み立てる。
 * ロケール非依存のパス(例: "/series/foo")を渡すと、ja/en それぞれの絶対URLを
 * `alternates.languages` に、x-default にはja版(存在しなければen版)を設定する。
 * ブログ記事やノートのように、片方のロケールにしかコンテンツが存在しない場合は
 * `availability` で存在するロケールのみを指定する。
 */
export function buildLocaleAlternates(
  path: string,
  locale: Locale,
  options?: BuildLocaleAlternatesOptions,
): NonNullable<Metadata["alternates"]> {
  const siteUrl = getSiteUrl();
  const availability = options?.availability ?? { ja: true, en: true };
  const canonicalLocale = options?.canonicalLocale ?? locale;

  const languages: Record<string, string> = {};
  for (const l of ALL_LOCALES) {
    if (availability[l]) {
      languages[l] = `${siteUrl}${toLocalePath(path, l)}`;
    }
  }

  const hasMultipleLocales = Object.keys(languages).length > 1;
  if (hasMultipleLocales) {
    languages["x-default"] = languages["ja"] ?? languages["en"]!;
  }

  return {
    canonical: toLocalePath(path, canonicalLocale),
    ...(hasMultipleLocales ? { languages } : {}),
  };
}
