import { NextResponse } from 'next/server';
import { getSortedPosts } from '@/libs/contents/utils';
import { Pages } from '@/libs/contents/blog';
import config from '@/config';

export const dynamic = 'force-static';

export async function GET() {
  const posts = await getSortedPosts({
    paths: ["blog"],
    schema: Pages["blog"].frontmatter,
  });

  // 最新の10件の記事のみRSSに含める
  const recentPosts = posts.slice(0, 10);

  const rssItems = recentPosts
    .map(post => {
      const pubDate = new Date(post.date).toUTCString();
      const link = `${config.metadata.url}/blog/post/${post._path}/`;
      
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.description || post.title}]]></description>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${pubDate}</pubDate>
      ${post.tags.map(tag => `<category><![CDATA[${tag}]]></category>`).join('')}
    </item>`;
    })
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${config.metadata.title}]]></title>
    <description><![CDATA[${config.metadata.description}]]></description>
    <link>${config.metadata.url}</link>
    <atom:link href="${config.metadata.url}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>ja</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Next.js</generator>
    ${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=1200, stale-while-revalidate=600',
    },
  });
} 