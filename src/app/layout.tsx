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
              // IIFE（即時実行関数）でブラウザ判定を隔離
              (function detectBrowser() {
                const ua = window.navigator.userAgent.toLowerCase();
                const isSafari = /safari/.test(ua) && !/chrome/.test(ua);
                const isIE = /msie|trident/.test(ua);
                const isLegacyEdge = /edge/.test(ua) && !/edg/.test(ua);
                
                // 特定のブラウザでは特別なクラスを適用
                if (isSafari || isIE || isLegacyEdge) {
                  document.documentElement.classList.add('browser-needs-attention');
                }
              })();
              
              // スティッキー位置の有効化
              function activateTocSticky() {
                const tocSidebar = document.querySelector('.toc-sidebar');
                if (!tocSidebar) return;
                
                // スティッキー効果を強化
                tocSidebar.classList.add('sticky-active');
                
                // 強制的に再計算を促す
                try {
                  const el = tocSidebar;
                  el.style.position = '';
                  void el.offsetHeight; // 再レイアウトを強制
                  el.style.position = 'sticky';
                } catch (e) { 
                  console.warn('Failed to reset sticky position:', e);
                }
              }
              
              // 記事の末尾にTOCが到達した時の処理
              function handleArticleEnd() {
                const article = document.querySelector('article');
                const tocWrapper = document.querySelector('.tocWrapper');
                if (!article || !tocWrapper) return;
                
                const articleRect = article.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                
                // 記事の末尾が見えている場合
                if (articleRect.bottom <= viewportHeight) {
                  tocWrapper.classList.add('toc-at-end');
                } else {
                  tocWrapper.classList.remove('toc-at-end');
                }
              }
              
              // position:stickyをサポートしていない場合のポリフィル
              function setupStickyPolyfill() {
                if (CSS && CSS.supports && CSS.supports('position', 'sticky')) {
                  console.log('Native sticky support available');
                  return; // ネイティブサポートあり
                }
                
                console.log('Applying position:sticky polyfill');
                const tocSidebar = document.querySelector('.toc-sidebar');
                if (!tocSidebar) return;
                
                let headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80;
                let tocOriginalTop = -1;
                
                function calcOriginalPosition() {
                  const rect = tocSidebar.getBoundingClientRect();
                  tocOriginalTop = window.pageYOffset + rect.top - headerHeight;
                  return tocOriginalTop;
                }
                
                // 初期位置を計算
                calcOriginalPosition();
                
                function handleScroll() {
                  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                  
                  if (scrollTop > tocOriginalTop) {
                    tocSidebar.style.position = 'fixed';
                    tocSidebar.style.top = headerHeight + 'px';
                  } else {
                    tocSidebar.style.position = '';
                    tocSidebar.style.top = '';
                  }
                  
                  // 記事末尾の処理も実行
                  handleArticleEnd();
                }
                
                window.addEventListener('scroll', handleScroll, { passive: true });
                window.addEventListener('resize', function() {
                  headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80;
                  // リサイズ時に位置を再計算
                  calcOriginalPosition();
                  handleScroll();
                }, { passive: true });
                
                // 初期実行
                handleScroll();
              }
              
              // ページロード完了後に実行する関数
              function onLoadComplete() {
                console.log('Page fully loaded, applying final TOC fixes');
                activateTocSticky();
                handleArticleEnd();
                setupStickyPolyfill();
              }
              
              // 初期化と実行
              setTimeout(activateTocSticky, 100);
              setTimeout(handleArticleEnd, 100);
              setTimeout(setupStickyPolyfill, 200);
              
              // 各種イベントリスナー
              window.addEventListener('load', onLoadComplete);
              window.addEventListener('scroll', function() {
                if (CSS && CSS.supports && CSS.supports('position', 'sticky')) {
                  // ネイティブstickyサポート時は記事末尾の処理のみ
                  handleArticleEnd();
                }
              }, { passive: true });
              
              // 最終的にスクリプトが確実に実行されたことを確認
              setTimeout(onLoadComplete, 1000);
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
