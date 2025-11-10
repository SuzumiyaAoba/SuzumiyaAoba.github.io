import { memo } from "react";
import Script from "next/script";

export interface GoogleAdsenseScriptProps {
  /** Google Adsenseのクライアントコード */
  clientId: string;
  /** 非同期読み込みの有無 */
  async?: boolean;
  /** クロスオリジンの設定 */
  crossOrigin?: "anonymous" | "use-credentials";
  /** スクリプト実行戦略 */
  strategy?: "afterInteractive" | "beforeInteractive" | "lazyOnload";
}

/**
 * Google Adsense用のスクリプトを読み込むコンポーネント
 */
export const GoogleAdsenseScript = memo(
  ({
    clientId = "ca-pub-4374004258861110",
    async = true,
    crossOrigin = "anonymous",
    strategy = "lazyOnload",
  }: GoogleAdsenseScriptProps) => {
    return (
      <Script
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
        crossOrigin={crossOrigin}
        async={async}
        strategy={strategy}
      />
    );
  },
);

GoogleAdsenseScript.displayName = "GoogleAdsenseScript";
