import type { MetadataRoute } from "next";
import { getBlogPostSummariesVariants } from "@/entities/blog";
import { getNoteSummariesVariants } from "@/entities/note";
import { getBookSlugs, getBookToc, getBookMeta } from "@/entities/book";
import { getSeriesList } from "@/entities/series-item";
import { getSiteConfig } from "@/shared/lib/site/site-config";
import { resolveLocalizedValue } from "@/shared/lib/routing";
import {
  buildContentSitemapEntries,
  buildTranslatedSitemapEntries,
  type SitemapPage,
} from "./_shared/sitemap-entries";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteConfig().siteUrl || "https://suzumiyaaoba.com";

  const buildTime = new Date();
  const staticPages = buildTranslatedSitemapEntries(
    [
      { path: "/", changeFrequency: "daily", priority: 1.0 },
      { path: "/about", changeFrequency: "monthly", priority: 0.8 },
      { path: "/blog", changeFrequency: "daily", priority: 0.9 },
      { path: "/notes", changeFrequency: "weekly", priority: 0.7 },
      { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
      { path: "/posts", changeFrequency: "weekly", priority: 0.7 },
      { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
      { path: "/search", changeFrequency: "monthly", priority: 0.5 },
      { path: "/series", changeFrequency: "weekly", priority: 0.8 },
      { path: "/tags", changeFrequency: "weekly", priority: 0.7 },
      { path: "/tools", changeFrequency: "monthly", priority: 0.6 },
      { path: "/tools/asset-formation-simulator", changeFrequency: "monthly", priority: 0.5 },
      { path: "/tools/ascii-standard-code", changeFrequency: "monthly", priority: 0.5 },
    ],
    siteUrl,
    buildTime,
  );

  const [posts, notes, seriesList] = await Promise.all([
    getBlogPostSummariesVariants(),
    getNoteSummariesVariants(),
    getSeriesList(),
  ]);
  const postsForDates = posts.flatMap((post) => resolveLocalizedValue(post, "ja") ?? []);
  const blogPages = buildContentSitemapEntries(posts, {
    basePath: "/blog/post",
    siteUrl,
    priority: 0.7,
    buildTime,
  });
  const notePages = buildContentSitemapEntries(notes, {
    basePath: "/notes",
    siteUrl,
    priority: 0.6,
    buildTime,
  });

  const bookSlugs = await getBookSlugs();
  const bookMetas = await Promise.all(bookSlugs.map((slug) => getBookMeta(slug)));
  const bookLastModified = new Map<string, Date>();
  for (const meta of bookMetas) {
    if (meta && meta.frontmatter.date) {
      bookLastModified.set(meta.slug, new Date(meta.frontmatter.date));
    }
  }
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

  const seriesPages = buildTranslatedSitemapEntries(
    seriesList.map(
      (series): SitemapPage => ({
        path: `/series/${series.slug}`,
        lastModified: seriesLastModified.get(series.slug) ?? buildTime,
        changeFrequency: "monthly",
        priority: 0.7,
      }),
    ),
    siteUrl,
    buildTime,
  );

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

  const tagPages = buildTranslatedSitemapEntries(
    Array.from(allTags).map(
      (tag): SitemapPage => ({
        path: `/tags/${encodeURIComponent(tag)}`,
        lastModified: tagLastModified.get(tag) ?? buildTime,
        changeFrequency: "weekly",
        priority: 0.6,
      }),
    ),
    siteUrl,
    buildTime,
  );

  return [
    ...staticPages,
    ...blogPages,
    ...notePages,
    ...bookIndexPages,
    ...bookSectionPages,
    ...seriesPages,
    ...tagPages,
  ];
}
