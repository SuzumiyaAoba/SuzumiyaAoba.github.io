import "./globals.css";
import type { Metadata } from "next";
import config from "@/config";
import { exo_2, mono as monoFont, zen_maru_gothic } from "@/fonts";
import { Header } from "@/components/Header";
import clsx from "clsx";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from "@next/third-parties/google";
import { GoogleAdsenseScript } from "@/components/Ads/GoogleAdsenseScript";
import BreadcrumbNav from "@/components/Breadcrumb";
import Script from "next/script";
import {
  getBlogTitleMap,
  getNoteTitleMap,
  getKeywordTitleMap,
  getBookTitleMap,
} from "@/libs/contents/title-map";
import { ThemeProvider } from "@/components/ThemeToggle/Provider";

// メインコンテンツに適用するスタイル（ヘッダーの下に表示するため）
import "./layout-globals.css";

export const metadata: Metadata = {
  title: config.metadata.title,
  description: config.metadata.description,
  keywords: config.metadata.keywords,
  authors: [{ name: config.metadata.author }],
  generator: "Next.js",
  metadataBase: new URL(config.metadata.url),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: config.metadata.title,
    description: config.metadata.description,
    url: config.metadata.url,
    siteName: config.metadata.title,
    locale: "ja_JP",
    type: "website",
    images: [
      {
        url: config.metadata.ogImage,
        width: 1200,
        height: 630,
        alt: config.metadata.title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: config.metadata.title,
    description: config.metadata.description,
    creator: config.metadata.twitterHandle,
    images: [config.metadata.ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // タイトルマップを取得
  const blogTitleMap = await getBlogTitleMap();
  const noteTitleMap = await getNoteTitleMap();
  const keywordTitleMap = await getKeywordTitleMap();
  const bookTitleMap = await getBookTitleMap();

  return (
    <html
      lang="ja"
      className="h-full"
      suppressHydrationWarning
    >
      <head>
        <style>
          {`
            html {
              scroll-padding-top: calc(var(--header-height, 80px) + 16px);
              scroll-behavior: smooth;
            }
          `}
        </style>
      </head>
      <body
        className={clsx(
          zen_maru_gothic.className,
          exo_2.variable,
          monoFont.variable,
          "flex flex-col w-full min-h-screen"
        )}
      >
        <ThemeProvider>
          <Header siteName={config.metadata.title} />
          <div className="content-container mt-header flex-grow w-full">
            <BreadcrumbNav
              blogTitleMap={blogTitleMap}
              noteTitleMap={noteTitleMap}
              keywordTitleMap={keywordTitleMap}
              bookTitleMap={bookTitleMap}
            />
            {children}
          </div>
          <Footer
            copyright="SuzumiyaAoba"
            poweredBy={{
              name: "Next.js",
              url: "https://nextjs.org",
            }}
          />
          <GoogleAnalytics gaId="G-6YJ00MPQBT" />
          <GoogleAdsenseScript />
        </ThemeProvider>
      </body>
    </html>
  );
}
