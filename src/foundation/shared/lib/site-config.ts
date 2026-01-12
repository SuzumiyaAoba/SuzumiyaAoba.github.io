import packageJson from "../../../../package.json";

type SiteConfig = {
  siteUrl?: string;
  googleAnalyticsId?: string;
  googleAdsenseClientId?: string;
};

export function getSiteConfig(): SiteConfig {
  return (packageJson as { siteConfig?: SiteConfig }).siteConfig ?? {};
}
