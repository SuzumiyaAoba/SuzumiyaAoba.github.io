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
            // TOCの追従スクロール問題を根本的に解決するシンプルな実装
            document.addEventListener('DOMContentLoaded', function() {
              console.log('DOM fully loaded - fixing TOC scroll');
              
              // トグル用のクラス操作関数（クラスの追加と削除を安全に行う）
              function toggleClass(element, className, shouldAdd) {
                if (!element) return;
                if (shouldAdd) {
                  if (!element.classList.contains(className)) {
                    element.classList.add(className);
                  }
                } else {
                  if (element.classList.contains(className)) {
                    element.classList.remove(className);
                  }
                }
              }
              
              // TOCの設定を行う関数（直接インラインスタイルで設定）
              function setupToc() {
                // ヘッダーの高さを取得・設定
                const header = document.querySelector('header');
                if (header) {
                  const headerHeight = header.offsetHeight + 16;
                  document.documentElement.style.setProperty('--header-height', \`\${headerHeight}px\`);
                  console.log('Header height set to:', headerHeight);
                }
                
                // トップレベルのコンテナ要素
                const tocWrapper = document.querySelector('.tocWrapper');
                if (tocWrapper) {
                  // 親要素は相対位置を確保
                  tocWrapper.style.position = 'relative';
                  tocWrapper.style.minHeight = '100vh';
                }
                
                // TOC要素本体
                const tocSidebar = document.querySelector('.toc-sidebar');
                if (!tocSidebar) {
                  console.warn('TOC sidebar element not found');
                  return;
                }
                
                // 記事要素
                const article = document.querySelector('article');
                if (!article) {
                  console.warn('Article element not found');
                  return;
                }
                
                const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80;
                
                // スクロール追従のためのスタイルを強制的に設定
                tocSidebar.style.position = 'sticky';
                tocSidebar.style.top = \`\${headerHeight}px\`;
                tocSidebar.style.alignSelf = 'flex-start';
                tocSidebar.style.maxHeight = 'none'; // 高さ制限を削除
                tocSidebar.style.overflowY = 'visible'; // スクロールを無効化
                tocSidebar.style.zIndex = '10';
                
                // 強制的にスクロール追従を有効化（ブラウザキャッシュをクリア）
                setTimeout(() => {
                  // 一度値をクリアしてから再設定
                  tocSidebar.style.position = '';
                  void tocSidebar.offsetHeight; // リフロー強制
                  tocSidebar.style.position = 'sticky';
                }, 10);
                
                // ログ出力
                console.log('TOC styles applied:', {
                  position: tocSidebar.style.position,
                  top: tocSidebar.style.top,
                  maxHeight: tocSidebar.style.maxHeight
                });
              }
              
              // スクロール時のTOC位置調整（記事末尾でのbottom固定に対応）
              function adjustTocPosition() {
                const tocSidebar = document.querySelector('.toc-sidebar');
                const article = document.querySelector('article');
                if (!tocSidebar || !article) return;
                
                const articleRect = article.getBoundingClientRect();
                const tocRect = tocSidebar.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                
                // 記事が画面下に到達した場合
                if (articleRect.bottom <= viewportHeight) {
                  // 記事の下に合わせる
                  tocSidebar.classList.add('toc-at-bottom');
                } else {
                  // 通常のsticky動作
                  tocSidebar.classList.remove('toc-at-bottom');
                }
              }
              
              // 初期化と再初期化
              function initialize() {
                setupToc();
                adjustTocPosition();
                
                // 強制的に再初期化するために遅延実行も行う
                setTimeout(setupToc, 500);
                setTimeout(adjustTocPosition, 500);
              }
              
              // 各種イベントリスナー設定
              window.addEventListener('scroll', adjustTocPosition, { passive: true });
              window.addEventListener('resize', initialize, { passive: true });
              window.addEventListener('load', initialize);
              
              // 実行
              initialize();
              
              // 最終的に確実に適用するための繰り返し処理
              const checkInterval = setInterval(() => {
                const tocSidebar = document.querySelector('.toc-sidebar');
                if (tocSidebar) {
                  const compStyle = getComputedStyle(tocSidebar);
                  console.log('TOC computed style:', {
                    position: compStyle.position,
                    top: compStyle.top
                  });
                  
                  // position:stickyが適用されていない場合は再設定
                  if (compStyle.position !== 'sticky') {
                    console.warn('TOC is not sticky, reapplying styles');
                    setupToc();
                  } else {
                    // 正常に適用されていれば確認を終了
                    clearInterval(checkInterval);
                  }
                }
              }, 1000);
              
              // 最大10秒後にチェックを終了
              setTimeout(() => clearInterval(checkInterval), 10000);
            });
          `}
        </Script>

        <Script id="position-sticky-polyfill" strategy="beforeInteractive">
          {`
            // position: stickyポリフィル（完全最終手段）
            (function() {
              if (CSS && CSS.supports && CSS.supports('position', 'sticky')) {
                // stickyがネイティブサポートされている場合は処理不要
                console.log('position:sticky is natively supported');
                return;
              }
              
              console.warn('position:sticky not supported, applying polyfill');
              
              // ポリフィル実装
              window.addEventListener('DOMContentLoaded', function() {
                setTimeout(function() {
                  const tocSidebar = document.querySelector('.toc-sidebar');
                  if (!tocSidebar) return;
                  
                  let lastScrollTop = 0;
                  let headerHeight = 80;
                  
                  // ヘッダー高さの取得
                  const header = document.querySelector('header');
                  if (header) {
                    headerHeight = header.offsetHeight + 16;
                  }
                  
                  // 基準位置の計算
                  const sidebarRect = tocSidebar.getBoundingClientRect();
                  const sidebarTop = window.pageYOffset + sidebarRect.top - headerHeight;
                  
                  // スクロールハンドラー
                  function handleScroll() {
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    
                    if (scrollTop > sidebarTop) {
                      tocSidebar.style.position = 'fixed';
                      tocSidebar.style.top = headerHeight + 'px';
                    } else {
                      tocSidebar.style.position = 'static';
                      tocSidebar.style.top = 'auto';
                    }
                    
                    lastScrollTop = scrollTop;
                  }
                  
                  // イベントリスナー登録
                  window.addEventListener('scroll', handleScroll, { passive: true });
                  window.addEventListener('resize', function() {
                    // リサイズ時に基準位置再計算
                    const sidebarRect = tocSidebar.getBoundingClientRect();
                    const header = document.querySelector('header');
                    if (header) {
                      headerHeight = header.offsetHeight + 16;
                    }
                    handleScroll();
                  }, { passive: true });
                  
                  // 初期実行
                  handleScroll();
                }, 1000);
              });
            })();
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
