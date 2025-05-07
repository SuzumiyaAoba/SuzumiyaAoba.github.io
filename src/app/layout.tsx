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
            // TOCの追従スクロール処理
            function handleTocScroll() {
              const toc = document.querySelector('.toc-sidebar');
              const article = document.querySelector('article');
              if (!toc || !article) return;
              
              // 記事要素の情報
              const articleRect = article.getBoundingClientRect();
              // TOC要素の情報
              const tocRect = toc.getBoundingClientRect();
              
              // ヘッダーの高さを取得（CSS変数より）
              const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80;
              
              // 記事の下端よりTOCが突き出ないようにする処理
              // 記事の下端位置（ビューポート相対）
              const articleBottom = articleRect.bottom;
              // TOCの高さ
              const tocHeight = tocRect.height;
              // 画面下端からの余白
              const bottomMargin = 24;
              
              // ビューポートの高さ
              const viewportHeight = window.innerHeight;
              
              // TOCの表示が記事よりも長い場合の処理
              if (tocHeight > articleRect.height) {
                // 記事より高い場合はposition:stickyを使わない（overflow:auto）
                toc.style.position = 'relative';
                toc.style.top = '0';
                toc.style.overflowY = 'auto';
                toc.style.maxHeight = \`\${articleRect.height}px\`;
                return;
              }
              
              // 記事の下端に達したかどうか
              if (articleBottom <= viewportHeight) {
                // 記事の下端がビューポートの下端より上にある場合
                // TOCが記事の下端を超えないように位置調整
                const topPosition = Math.min(
                  articleBottom - tocHeight - bottomMargin,
                  headerHeight
                );
                toc.style.top = \`\${Math.max(topPosition, 0)}px\`;
              } else {
                // 通常のスクロール時はヘッダー分だけ下げる
                toc.style.top = \`\${headerHeight}px\`;
              }
            }
            
            // ヘッダーの高さを取得してCSSカスタムプロパティに設定
            function updateHeaderHeight() {
              const header = document.querySelector('header');
              if (!header) return;
              
              // ヘッダーの高さ + 余白
              const headerHeight = header.offsetHeight + 16;
              document.documentElement.style.setProperty('--header-height', \`\${headerHeight}px\`);
            }
            
            // 初期化と各種イベントリスナー設定
            function initializeToc() {
              updateHeaderHeight();
              handleTocScroll();
              
              // スクロール時
              window.addEventListener('scroll', handleTocScroll, { passive: true });
              // リサイズ時
              window.addEventListener('resize', () => {
                updateHeaderHeight();
                handleTocScroll();
              }, { passive: true });
              // ロード完了時
              window.addEventListener('load', () => {
                updateHeaderHeight();
                handleTocScroll();
              });
              
              // 遅延実行（画像やフォントロード後）
              setTimeout(() => {
                updateHeaderHeight();
                handleTocScroll();
              }, 1000);
            }
            
            // DOM読み込み完了時に初期化
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', initializeToc);
            } else {
              initializeToc();
            }
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
