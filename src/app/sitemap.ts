import type { MetadataRoute } from "next";
import { getBlogPostsVariants } from "@/entities/blog";
import { getSeriesSlugs } from "@/entities/series-item/model/series";
import { getSiteConfig } from "@/shared/lib/site-config";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteConfig().siteUrl || "https://suzumiyaaoba.com";

  const staticPagesBase: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/about/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/blog/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/contact/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/keywords/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/posts/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/privacy-policy/`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/search/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/series/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/tags/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/tools/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/tools/asset-formation-simulator/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/tools/ascii-standard-code/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const staticPagesEn = staticPagesBase.map((entry) => ({
    ...entry,
    url: entry.url.replace(`${siteUrl}/`, `${siteUrl}/en/`),
  }));

  const staticPages = [...staticPagesBase, ...staticPagesEn];

  const posts = await getBlogPostsVariants();
  const postsForDates = posts.map((post) => post.ja ?? post.en).filter(Boolean);
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/post/${post.slug}/`,
    lastModified: (post.ja ?? post.en)?.frontmatter.date
      ? new Date((post.ja ?? post.en)?.frontmatter.date ?? new Date())
      : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const blogPagesEn: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/en/blog/post/${post.slug}/`,
    lastModified: (post.en ?? post.ja)?.frontmatter.date
      ? new Date((post.en ?? post.ja)?.frontmatter.date ?? new Date())
      : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const seriesSlugs = await getSeriesSlugs();
  const seriesPages: MetadataRoute.Sitemap = seriesSlugs.map((slug) => ({
    url: `${siteUrl}/series/${slug}/`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const seriesPagesEn: MetadataRoute.Sitemap = seriesSlugs.map((slug) => ({
    url: `${siteUrl}/en/series/${slug}/`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const allTags = new Set<string>();
  for (const post of postsForDates) {
    if (post?.frontmatter.tags) {
      for (const tag of post.frontmatter.tags) {
        allTags.add(tag);
      }
    }
  }

  const tagPages: MetadataRoute.Sitemap = Array.from(allTags).map((tag) => ({
    url: `${siteUrl}/tags/${encodeURIComponent(tag)}/`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
  const tagPagesEn: MetadataRoute.Sitemap = Array.from(allTags).map((tag) => ({
    url: `${siteUrl}/en/tags/${encodeURIComponent(tag)}/`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...blogPages,
    ...blogPagesEn,
    ...seriesPages,
    ...seriesPagesEn,
    ...tagPages,
    ...tagPagesEn,
  ];
}
