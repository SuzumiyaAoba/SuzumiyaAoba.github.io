import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AppProviders } from "@/app/providers";
import { GoogleAdsenseScript } from "@/shared/ui/google-adsense-script";
import { getSiteConfig } from "@/shared/lib/site/site-config";
import { SITE_DESCRIPTION } from "@/shared/lib/site/site-description";
import { SITE_TITLE } from "@/shared/lib/site/site-title";
import { buildWebsiteJsonLd } from "@/shared/lib/site/website-jsonld";
import type { Locale } from "@/shared/lib/routing";
import { JsonLd } from "@/shared/ui/seo";
import { notoSansJp, shipporiMincho, sourceCodePro } from "./fonts";

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

/**
 * ルートレイアウトコンポーネント。フォントの設定、プロバイダーのラップ、
 * およびアナリティクススクリプトの挿入を行う。ja/en で lang 以外は共通。
 */
export function AppRootLayout({
  locale,
  children,
}: Readonly<{
  locale: Locale;
  children: React.ReactNode;
}>) {
  const isProd = process.env.NODE_ENV === "production";
  const siteConfig = getSiteConfig();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${shipporiMincho.variable} ${sourceCodePro.variable} ${notoSansJp.variable}`}
    >
      <body className="font-sans antialiased">
        <JsonLd data={buildWebsiteJsonLd(locale)} />
        <AppProviders>{children}</AppProviders>
        {isProd ? (
          <>
            {siteConfig.googleAnalyticsId ? (
              <GoogleAnalytics gaId={siteConfig.googleAnalyticsId} />
            ) : null}
            {siteConfig.googleAdsenseClientId ? (
              <GoogleAdsenseScript clientId={siteConfig.googleAdsenseClientId} />
            ) : null}
          </>
        ) : null}
      </body>
    </html>
  );
}
