import packageJson from "../../../../package.json";

/**
 * サイト設定の型定義
 */
type SiteConfig = {
  /** サイトのベースURL */
  siteUrl?: string;
  /** Google Analytics の ID */
  googleAnalyticsId?: string;
  /** Google AdSense のクライアント ID */
  googleAdsenseClientId?: string;
};

/**
 * package.json からサイト設定を取得する
 * @returns サイト設定オブジェクト
 */
export function getSiteConfig(): SiteConfig {
  return (packageJson as { siteConfig?: SiteConfig }).siteConfig ?? {};
}
