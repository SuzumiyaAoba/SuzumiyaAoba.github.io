import { getSiteConfig } from "@/shared/lib/site-config";

/**
 * サイトのベースURLを取得する
 * configuration から取得し、末尾のスラッシュを削除する
 * @returns サイトのベースURL
 */
export function getSiteUrl(): string {
  const siteUrl = getSiteConfig().siteUrl;
  if (siteUrl && siteUrl.trim().length > 0) {
    return siteUrl.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}
