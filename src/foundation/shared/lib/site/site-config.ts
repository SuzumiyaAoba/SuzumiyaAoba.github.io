import packageJson from "../../../../../package.json";

/**
 * サイト設定の型定義
 */
type SiteConfig = {
  /** サイトのベースURL */
  siteUrl?: string | undefined;
  /** Google Analytics の ID */
  googleAnalyticsId?: string | undefined;
  /** Google AdSense のクライアント ID */
  googleAdsenseClientId?: string | undefined;
};

/**
 * 値が文字列のときだけ返す。それ以外（未定義・型違い）は undefined。
 */
function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * package.json からサイト設定を取得する。
 *
 * 以前は Zod でバリデーションしていたが、検証対象がビルド時に確定する
 * 3 つの任意文字列のみである一方、クライアントコンポーネントから
 * 参照された際に zod 本体（約 20KB gzip）がバンドルへ載っていたため、
 * 依存のない実装に置き換えている。
 * @returns サイト設定オブジェクト
 */
export function getSiteConfig(): SiteConfig {
  const siteConfig: unknown = (packageJson as { siteConfig?: unknown }).siteConfig;
  const raw: Record<string, unknown> =
    typeof siteConfig === "object" && siteConfig !== null
      ? (siteConfig as Record<string, unknown>)
      : {};

  return {
    siteUrl: optionalString(raw["siteUrl"]),
    googleAnalyticsId: optionalString(raw["googleAnalyticsId"]),
    googleAdsenseClientId: optionalString(raw["googleAdsenseClientId"]),
  };
}
