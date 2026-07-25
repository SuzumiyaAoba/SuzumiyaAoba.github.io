import type { MetadataRoute } from "next";
import { getBlogPostSummariesVariants } from "@/entities/blog";
import { getNoteSummariesVariants } from "@/entities/note";
import { getBookSlugs, getBookToc, getBookMeta } from "@/entities/book";
import { getSeriesList, getSeriesSlugs } from "@/entities/series-item/model/series";
import { getSiteConfig } from "@/shared/lib/site/site-config";

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
      url: `${siteUrl}/notes/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
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

  const posts = await getBlogPostSummariesVariants();
  const postsForDates = posts.map((post) => post.ja ?? post.en).filter(Boolean);
  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/post/${post.slug}/`,
    lastModified: (post.ja ?? post.en)?.frontmatter.date
      ? new Date((post.ja ?? post.en)?.frontmatter.date ?? new Date())
      : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const blogPagesEn: MetadataRoute.Sitemap = posts
    .filter((post) => Boolean(post.en))
    .map((post) => ({
      url: `${siteUrl}/en/blog/post/${post.slug}/`,
      lastModified: post.en?.frontmatter.date ? new Date(post.en.frontmatter.date) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  const notes = await getNoteSummariesVariants();
  const notePages: MetadataRoute.Sitemap = notes.map((note) => ({
    url: `${siteUrl}/notes/${note.slug}/`,
    lastModified: (note.ja ?? note.en)?.frontmatter.date
      ? new Date((note.ja ?? note.en)?.frontmatter.date ?? new Date())
      : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const notePagesEn: MetadataRoute.Sitemap = notes
    .filter((note) => Boolean(note.en))
    .map((note) => ({
      url: `${siteUrl}/en/notes/${note.slug}/`,
      lastModified: note.en?.frontmatter.date ? new Date(note.en.frontmatter.date) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const bookSlugs = await getBookSlugs();
  const bookMetas = await Promise.all(bookSlugs.map((slug) => getBookMeta(slug)));
  const bookLastModified = new Map<string, Date>();
  for (const meta of bookMetas) {
    if (meta && meta.frontmatter.date) {
      bookLastModified.set(meta.slug, new Date(meta.frontmatter.date));
    }
  }
  const buildTime = new Date();
  const lastModifiedForBook = (slug: string) => bookLastModified.get(slug) ?? buildTime;

  const bookIndexPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/books/`,
      lastModified: buildTime,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...bookSlugs.map((slug) => ({
      url: `${siteUrl}/books/${slug}/`,
      lastModified: lastModifiedForBook(slug),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
  const bookSectionPages: MetadataRoute.Sitemap = [];
  for (const slug of bookSlugs) {
    const toc = await getBookToc(slug);
    for (const ch of toc) {
      for (const sec of ch.sections) {
        bookSectionPages.push({
          url: `${siteUrl}/books/${slug}/${sec.chapter}/${sec.section}/`,
          lastModified: lastModifiedForBook(slug),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    }
  }

  const postLastModifiedBySlug = new Map<string, Date>();
  for (const post of postsForDates) {
    if (post && post.frontmatter.date) {
      postLastModifiedBySlug.set(post.slug, new Date(post.frontmatter.date));
    }
  }

  const seriesList = await getSeriesList();
  const seriesLastModified = new Map<string, Date>();
  for (const series of seriesList) {
    let latest: Date | undefined;
    for (const postSlug of series.posts) {
      const postDate = postLastModifiedBySlug.get(postSlug);
      if (postDate && (!latest || postDate > latest)) {
        latest = postDate;
      }
    }
    if (latest) {
      seriesLastModified.set(series.slug, latest);
    }
  }

  const seriesSlugs = await getSeriesSlugs();
  const seriesPages: MetadataRoute.Sitemap = seriesSlugs.map((slug) => ({
    url: `${siteUrl}/series/${slug}/`,
    lastModified: seriesLastModified.get(slug) ?? buildTime,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const seriesPagesEn: MetadataRoute.Sitemap = seriesSlugs.map((slug) => ({
    url: `${siteUrl}/en/series/${slug}/`,
    lastModified: seriesLastModified.get(slug) ?? buildTime,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const allTags = new Set<string>();
  const tagLastModified = new Map<string, Date>();
  for (const post of postsForDates) {
    if (post?.frontmatter.tags) {
      for (const tag of post.frontmatter.tags) {
        allTags.add(tag);
      }
      if (post.frontmatter.date) {
        const postDate = new Date(post.frontmatter.date);
        for (const tag of post.frontmatter.tags) {
          const existing = tagLastModified.get(tag);
          if (!existing || postDate > existing) {
            tagLastModified.set(tag, postDate);
          }
        }
      }
    }
  }

  const tagPages: MetadataRoute.Sitemap = Array.from(allTags).map((tag) => ({
    url: `${siteUrl}/tags/${encodeURIComponent(tag)}/`,
    lastModified: tagLastModified.get(tag) ?? buildTime,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));
  const tagPagesEn: MetadataRoute.Sitemap = Array.from(allTags).map((tag) => ({
    url: `${siteUrl}/en/tags/${encodeURIComponent(tag)}/`,
    lastModified: tagLastModified.get(tag) ?? buildTime,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...blogPages,
    ...blogPagesEn,
    ...notePages,
    ...notePagesEn,
    ...bookIndexPages,
    ...bookSectionPages,
    ...seriesPages,
    ...seriesPagesEn,
    ...tagPages,
    ...tagPagesEn,
  ];
}
