import { getBlogPostsVariants, type BlogLocale } from "@/entities/blog";
import { getSiteConfig, SITE_TITLE } from "@/shared/lib/site";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatRssDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return new Date().toUTCString();
  }
  return date.toUTCString();
}

/**
 * 指定ロケールのブログ記事一覧から RSS 2.0 XML を生成する
 * @param locale 出力するRSSの言語
 * @returns RSS 2.0 XML文字列
 */
export async function buildRssXml(locale: BlogLocale): Promise<string> {
  const siteUrl = getSiteConfig().siteUrl || "https://suzumiyaaoba.com";
  const basePath = locale === "en" ? "/en" : "";
  const blogLink = `${siteUrl}${basePath}/blog/`;
  const feedLink = `${siteUrl}${basePath}/rss.xml`;

  const posts = await getBlogPostsVariants();
  const localizedPosts = posts
    .map((post) => (locale === "en" ? post.en : post.ja))
    .filter((post): post is NonNullable<typeof post> => Boolean(post))
    .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));

  const items = localizedPosts.map((post) => {
    const link = `${siteUrl}${basePath}/blog/post/${post.slug}/`;
    const pubDate = formatRssDate(post.frontmatter.date);
    const title = post.frontmatter.title || post.slug;
    return {
      title,
      link,
      pubDate,
      description: title,
      guid: link,
    };
  });

  const channelTitle = locale === "en" ? `${SITE_TITLE} (EN)` : SITE_TITLE;
  const language = locale === "en" ? "en" : "ja";

  const itemXml = items
    .map(
      (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid>${escapeXml(item.guid)}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(blogLink)}</link>
    <description>${escapeXml(SITE_TITLE)}</description>
    <language>${language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedLink)}" rel="self" type="application/rss+xml" />
    ${itemXml}
  </channel>
</rss>`;
}
