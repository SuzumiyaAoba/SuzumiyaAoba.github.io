import type { Metadata } from "next";
import { Noto_Sans_JP, Shippori_Mincho, Source_Code_Pro } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "@/app/styles/globals.css";
import "katex/dist/katex.min.css";
import { AppProviders } from "@/app/providers";
import { GoogleAdsenseScript } from "@/shared/ui/google-adsense-script";
import { getSiteConfig } from "@/shared/lib/site/site-config";
import { SITE_TITLE } from "@/shared/lib/site/site-title";

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const shipporiMincho = Shippori_Mincho({
  variable: "--font-shippori-mincho",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

/**
 * 英語版の基本メタデータ設定
 */
export const metadata: Metadata = {
  metadataBase: new URL(getSiteConfig().siteUrl || "http://localhost:3000"),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_TITLE}`,
  },
  description: SITE_TITLE,
  openGraph: {
    title: {
      default: SITE_TITLE,
      template: `%s | ${SITE_TITLE}`,
    },
    description: SITE_TITLE,
    siteName: SITE_TITLE,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: SITE_TITLE,
      template: `%s | ${SITE_TITLE}`,
    },
    description: SITE_TITLE,
  },
  verification: {
    google: "google19f820ba5c9c10b8",
  },
};

/**
 * 英語版のルートレイアウトコンポーネント。
 * フォントの設定、プロバイダーのラップ、およびアナリティクススクリプトの挿入を行います。
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProd = process.env.NODE_ENV === "production";
  const siteConfig = getSiteConfig();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${shipporiMincho.variable} ${sourceCodePro.variable} ${notoSansJp.variable}`}
    >
      <body className="font-sans antialiased">
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
