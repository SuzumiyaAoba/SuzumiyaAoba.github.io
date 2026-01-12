import { getSiteConfig } from "@/shared/lib/site-config";

export function getSiteUrl(): string {
  const siteUrl = getSiteConfig().siteUrl;
  if (siteUrl && siteUrl.trim().length > 0) {
    return siteUrl.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}
