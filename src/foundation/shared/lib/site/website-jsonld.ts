import type { Locale } from "@/shared/lib/routing";
import { SITE_DESCRIPTION } from "./site-description";
import { SITE_TITLE } from "./site-title";
import { getSiteUrl } from "./site-url";

const AUTHOR_NAME = "SuzumiyaAoba";

/**
 * サイト全体を表す WebSite (+ 著者 Person) の構造化データ(JSON-LD)を組み立てる。
 * ルートレイアウトから全ページ共通で出力する。
 * (routing モジュールとの循環importを避けるため、toLocalePath は使わずホームパスを直接組み立てる)
 */
export function buildWebsiteJsonLd(locale: Locale) {
  const siteUrl = getSiteUrl();
  const homePath = locale === "en" ? "/en" : "/";
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_TITLE,
    description: SITE_DESCRIPTION[locale],
    url: `${siteUrl}${homePath}`,
    inLanguage: locale,
    author: {
      "@type": "Person",
      name: AUTHOR_NAME,
    },
  };
}
