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
import {
  getBlogTitleMap,
  getNoteTitleMap,
  getKeywordTitleMap,
} from "@/libs/contents/title-map";

// メインコンテンツに適用するスタイル（ヘッダーの下に表示するため）
import "./layout-globals.css";

export const metadata: Metadata = {
  title: config.metadata.title,
  generator: "Next.js",
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
    <html lang="ja">
      <body
        className={clsx(
          zen_maru_gothic.className,
          exo_2.variable,
          monoFont.variable,
          "flex flex-col w-full h-screen"
        )}
      >
        <Header siteName={config.metadata.title} />
        <div className="content-container mt-header flex-grow">
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
      </body>
      <GoogleAnalytics gaId="G-6YJ00MPQBT" />
      <GoogleAdsenseScript />
    </html>
  );
}
