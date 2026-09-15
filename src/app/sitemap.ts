import type { MetadataRoute } from "next";
import { getAllBlogTags, getBlogPostSummariesVariants } from "@/entities/blog";
import { getNoteSummariesVariants } from "@/entities/note";
import { getBookSlugs, getBookToc, getBookMeta } from "@/entities/book";
import { getSeriesList } from "@/entities/series-item";
import { getSiteUrl } from "@/shared/lib/site/site-url";
import { resolveLocalizedValue } from "@/shared/lib/routing";
import {
  buildContentSitemapEntries,
  buildTranslatedSitemapEntries,
} from "./_shared/sitemap-entries";
import type { SitemapPage } from "./_shared/sitemap-entries";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const buildTime = new Date();
  const aiNewsPages: MetadataRoute.Sitemap = [
    "/archive/ai-news/",
    "/archive/ai-news/timeline/",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: buildTime,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  const staticPages = buildTranslatedSitemapEntries(
    [
      { path: "/", changeFrequency: "daily", priority: 1 },
      { path: "/about", changeFrequency: "monthly", priority: 0.8 },
      { path: "/awesome-something", changeFrequency: "weekly", priority: 0.7 },
      { path: "/blog", changeFrequency: "daily", priority: 0.9 },
      { path: "/notes", changeFrequency: "weekly", priority: 0.7 },
      { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
      { path: "/posts", changeFrequency: "weekly", priority: 0.7 },
      { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
      { path: "/search", changeFrequency: "monthly", priority: 0.5 },
      { path: "/series", changeFrequency: "weekly", priority: 0.8 },
      { path: "/tags", changeFrequency: "weekly", priority: 0.7 },
      { path: "/tools", changeFrequency: "monthly", priority: 0.6 },
      {
        path: "/tools/asset-formation-simulator",
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        path: "/tools/ascii-standard-code",
        changeFrequency: "monthly",
        priority: 0.5,
      },
    ],
    siteUrl,
    buildTime
  );

  const [posts, notes, seriesList, tags] = await Promise.all([
    getBlogPostSummariesVariants(),
    getNoteSummariesVariants(),
    getSeriesList(),
    getAllBlogTags(),
  ]);
  const postsForDates = posts.flatMap(
    (post) => resolveLocalizedValue(post, "ja") ?? []
  );
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
  const bookMetas = await Promise.all(
    bookSlugs.map(async (slug) => await getBookMeta(slug))
  );
  const bookLastModified = new Map<string, Date>();
  for (const meta of bookMetas) {
    if (meta?.frontmatter.date) {
      bookLastModified.set(meta.slug, new Date(meta.frontmatter.date));
    }
  }
  const lastModifiedForBook = (slug: string) =>
    bookLastModified.get(slug) ?? buildTime;

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
  const booksWithToc = await Promise.all(
    bookSlugs.map(async (slug) => ({ slug, toc: await getBookToc(slug) }))
  );
  for (const { slug, toc } of booksWithToc) {
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
    if (post.frontmatter.date) {
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
    seriesList.map((series): SitemapPage => ({
      path: `/series/${series.slug}`,
      lastModified: seriesLastModified.get(series.slug) ?? buildTime,
      changeFrequency: "monthly",
      priority: 0.7,
    })),
    siteUrl,
    buildTime
  );

  const tagPages = buildTranslatedSitemapEntries(
    tags.map((tag): SitemapPage => ({
      path: `/tags/${encodeURIComponent(tag.name)}`,
      lastModified: tag.lastModified ?? buildTime,
      changeFrequency: "weekly",
      priority: 0.6,
    })),
    siteUrl,
    buildTime
  );

  return [
    ...staticPages,
    ...aiNewsPages,
    ...blogPages,
    ...notePages,
    ...bookIndexPages,
    ...bookSectionPages,
    ...seriesPages,
    ...tagPages,
  ];
}
