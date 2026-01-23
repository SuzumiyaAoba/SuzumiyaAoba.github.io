import { z } from "zod";

import packageJson from "../../../../../package.json";

/**
 * サイト設定の Zod スキーマ
 */
const SiteConfigSchema = z.object({
  /** サイトのベースURL */
  siteUrl: z.string().optional(),
  /** Google Analytics の ID */
  googleAnalyticsId: z.string().optional(),
  /** Google AdSense のクライアント ID */
  googleAdsenseClientId: z.string().optional(),
});

/**
 * サイト設定の型定義
 */
type SiteConfig = z.infer<typeof SiteConfigSchema>;

/**
 * package.json の構造の Zod スキーマ
 */
const PackageJsonSchema = z.object({
  siteConfig: SiteConfigSchema.optional(),
});

/**
 * package.json からサイト設定を取得する
 * @returns サイト設定オブジェクト
 */
export function getSiteConfig(): SiteConfig {
  const result = PackageJsonSchema.safeParse(packageJson);
  return result.success ? (result.data.siteConfig ?? {}) : {};
}
