import type { MetadataRoute } from "next";
import type { LocalizedContent } from "@/shared/lib/content-file";
import { resolveLocalizedValue, toLocalePath, type Locale } from "@/shared/lib/routing";

type SitemapEntry = MetadataRoute.Sitemap[number];
export type SitemapPage = Omit<SitemapEntry, "url"> & { path: string };

/** 対称なページを日本語・英語の順に展開する。 */
export function buildTranslatedSitemapEntries(
  pages: SitemapPage[],
  siteUrl: string,
  buildTime: Date,
): MetadataRoute.Sitemap {
  return (["ja", "en"] as const).flatMap((locale) =>
    pages.map(({ path, ...metadata }) => ({
      lastModified: buildTime,
      ...metadata,
      url: `${siteUrl}${toLocalePath(path, locale)}`,
    })),
  );
}

type DatedEntry = { frontmatter: { date?: string } };

/** 日本語URLはフォールバックを許可し、英語URLは実体がある場合だけ掲載する。 */
export function buildContentSitemapEntries(
  entries: LocalizedContent<DatedEntry>[],
  {
    basePath,
    siteUrl,
    priority,
    buildTime,
  }: {
    basePath: string;
    siteUrl: string;
    priority: number;
    buildTime: Date;
  },
): MetadataRoute.Sitemap {
  const pagesForLocale = (locale: Locale) =>
    entries.flatMap((entry): MetadataRoute.Sitemap => {
      if (locale === "en" && !entry.en) return [];
      const date = resolveLocalizedValue(entry, locale)?.frontmatter.date;
      return [
        {
          url: `${siteUrl}${toLocalePath(`${basePath}/${entry.slug}`, locale)}`,
          lastModified: date ? new Date(date) : buildTime,
          changeFrequency: "monthly",
          priority,
        },
      ];
    });
  return [...pagesForLocale("ja"), ...pagesForLocale("en")];
}
