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
        <Script id="layout-helpers" strategy="afterInteractive">
          {`
            // ヘッダー高さの取得とCSS変数への適用
            document.addEventListener('DOMContentLoaded', function() {
              function setHeaderHeight() {
                const header = document.querySelector('header');
                if (header) {
                  const headerHeight = header.offsetHeight + 16;
                  document.documentElement.style.setProperty('--header-height', headerHeight + 'px');
                }
              }
              
              // 初期実行
              setHeaderHeight();
              
              // リサイズ時に再計算
              window.addEventListener('resize', setHeaderHeight, { passive: true });
            });
          `}
        </Script>

        <Script id="toc-helper" strategy="afterInteractive">
          {`
            // TOC（目次）のスクロール追従を強化するヘルパー
            document.addEventListener('DOMContentLoaded', function() {
              // スティッキー位置の有効化
              function activateTocSticky() {
                const tocSidebar = document.querySelector('.toc-sidebar');
                if (!tocSidebar) return;
                
                // スティッキー効果を強化
                tocSidebar.classList.add('sticky-active');
                
                // スタイル確認とログ出力（デバッグ用）
                const computedStyle = getComputedStyle(tocSidebar);
                console.log('TOC styles applied - position:', computedStyle.position, 'top:', computedStyle.top);
              }
              
              // position:stickyをサポートしていない場合のポリフィル
              function setupStickyPolyfill() {
                if (CSS && CSS.supports && CSS.supports('position', 'sticky')) {
                  return; // ネイティブサポートあり
                }
                
                console.log('Applying position:sticky polyfill');
                const tocSidebar = document.querySelector('.toc-sidebar');
                if (!tocSidebar) return;
                
                let headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80;
                const tocTop = window.pageYOffset + tocSidebar.getBoundingClientRect().top - headerHeight;
                
                function handleScroll() {
                  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                  tocSidebar.style.position = scrollTop > tocTop ? 'fixed' : 'static';
                  tocSidebar.style.top = scrollTop > tocTop ? headerHeight + 'px' : 'auto';
                }
                
                window.addEventListener('scroll', handleScroll, { passive: true });
                window.addEventListener('resize', function() {
                  headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80;
                  handleScroll();
                }, { passive: true });
                
                handleScroll();
              }
              
              // 初期化と実行
              setTimeout(activateTocSticky, 100);
              setTimeout(setupStickyPolyfill, 100);
              window.addEventListener('load', function() {
                activateTocSticky();
                setupStickyPolyfill();
              });
            });
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
