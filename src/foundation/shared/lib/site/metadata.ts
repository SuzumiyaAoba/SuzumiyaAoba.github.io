export type MetadataTitle =
  | string
  | { default?: string; template?: string; absolute?: string };
export type Metadata = {
  metadataBase?: URL;
  title?: MetadataTitle;
  description?: string | undefined;
  alternates?: { canonical?: string; languages?: Record<string, string> };
  openGraph?: {
    title?: MetadataTitle;
    description?: string | undefined;
    siteName?: string;
    locale?: string;
    type?: string;
    publishedTime?: string | undefined;
    modifiedTime?: string;
    images?: (
      | string
      | { url: string; width?: number; height?: number; alt?: string }
    )[];
  };
  twitter?: { card?: string; title?: MetadataTitle; description?: string };
  verification?: { google?: string };
  robots?: { index?: boolean; follow?: boolean };
};

export type SitemapEntry = {
  url: string;
  lastModified?: Date | string;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
};
export type Sitemap = SitemapEntry[];
