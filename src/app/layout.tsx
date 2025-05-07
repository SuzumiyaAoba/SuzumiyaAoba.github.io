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
} from "@/libs/contents/title-map";

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

  return (
    <html lang="ja" className="overflow-x-hidden h-full">
      <body
        className={clsx(
          zen_maru_gothic.className,
          exo_2.variable,
          monoFont.variable,
          "flex flex-col w-full min-h-screen overflow-x-hidden"
        )}
      >
        <Script id="toc-scroll">
          {`
            function handleTocSticky() {
              const toc = document.querySelector('.toc-sidebar');
              const article = document.querySelector('article');
              if (!toc || !article) return;

              // 親要素（tocWrapper）をrelativeにしておくこと
              const wrapper = toc.closest('.tocWrapper');
              if (wrapper) {
                wrapper.style.position = 'relative';
              }

              const articleRect = article.getBoundingClientRect();
              const tocRect = toc.getBoundingClientRect();
              const wrapperRect = wrapper ? wrapper.getBoundingClientRect() : null;
              const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80;
              const offset = 24; // 余白

              // スクロール量
              const scrollY = window.scrollY || window.pageYOffset;
              // 記事下端の絶対座標
              const articleBottom = articleRect.bottom + scrollY;
              // TOCの下端の絶対座標
              const tocBottom = tocRect.top + scrollY + tocRect.height;

              // TOCが記事下端を超えそうになったらabsoluteでbottom:0
              if (tocBottom + offset > articleBottom) {
                toc.style.position = 'absolute';
                toc.style.top = 'auto';
                toc.style.bottom = '0';
              } else {
                toc.style.position = 'sticky';
                toc.style.top = 'var(--header-height, 80px)';
                toc.style.bottom = 'auto';
              }
            }

            function adjustTocPosition() {
              const header = document.querySelector('header');
              if (!header) return;
              const headerHeight = header.offsetHeight + 10;
              document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
              handleTocSticky();
            }

            // 即時実行
            adjustTocPosition();
            // DOMContentLoaded時
            document.addEventListener('DOMContentLoaded', adjustTocPosition);
            // resize時
            window.addEventListener('resize', adjustTocPosition);
            // scroll時
            window.addEventListener('scroll', handleTocSticky);
            // 遅延実行で確実に
            setTimeout(adjustTocPosition, 500);
          `}
        </Script>

        <Header siteName={config.metadata.title} />
        <div className="content-container mt-header flex-grow w-full">
          <BreadcrumbNav
            blogTitleMap={blogTitleMap}
            noteTitleMap={noteTitleMap}
            keywordTitleMap={keywordTitleMap}
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
      </body>
    </html>
  );
}
