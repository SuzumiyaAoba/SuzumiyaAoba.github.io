import type { Metadata } from "@/shared/lib/site/metadata";
import { getSiteConfig } from "@/shared/lib/site/site-config";
import { SITE_DESCRIPTION } from "@/shared/lib/site/site-description";
import { SITE_TITLE } from "@/shared/lib/site/site-title";
import type { Locale } from "@/shared/lib/routing";

const OPEN_GRAPH_LOCALE: Record<Locale, string> = {
  ja: "ja_JP",
  en: "en_US",
};

/**
 * ルートレイアウトの基本メタデータ設定。ja/en で locale 以外は共通。
 */
export function buildRootMetadata(locale: Locale): Metadata {
  const description = SITE_DESCRIPTION[locale];
  return {
    metadataBase: new URL(getSiteConfig().siteUrl || "http://localhost:3000"),
    title: {
      default: SITE_TITLE,
      template: `%s | ${SITE_TITLE}`,
    },
    description,
    openGraph: {
      title: {
        default: SITE_TITLE,
        template: `%s | ${SITE_TITLE}`,
      },
      description,
      siteName: SITE_TITLE,
      locale: OPEN_GRAPH_LOCALE[locale],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: {
        default: SITE_TITLE,
        template: `%s | ${SITE_TITLE}`,
      },
      description,
    },
    verification: {
      google: "OOhB0rXu7vv-Hn_navXlbhnbBfJLrNDo6wEL0ygWr-E",
    },
  };
}
