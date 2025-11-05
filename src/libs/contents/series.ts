import { z } from "zod";
import type { Content } from "./markdown";
import { blogFrontmatterSchema } from "./schema";
import { getFrontmatters } from "./markdown";
import { generateSlugFromSeriesName } from "./series-utils";

export type SeriesContent = Content<z.infer<typeof blogFrontmatterSchema>>;

/**
 * シリーズ情報を含む記事の型
 */
export interface SeriesPost {
  slug: string;
  frontmatter: z.infer<typeof blogFrontmatterSchema>;
  path: string;
}

/**
 * シリーズの情報
 */
export interface SeriesInfo {
  name: string;
  slug: string; // URL用のslug
  posts: SeriesPost[];
  totalPosts: number;
}

/**
 * 全てのシリーズを取得
 */
export async function getAllSeries(): Promise<Record<string, SeriesInfo>> {
  const allPosts = await getFrontmatters({
    paths: ["blog"],
    schema: blogFrontmatterSchema,
  });

  const seriesMap: Record<string, SeriesPost[]> = {};

  allPosts.forEach((post) => {
    if (post.series) {
      const seriesName = post.series;
      if (!seriesMap[seriesName]) {
        seriesMap[seriesName] = [];
      }
      seriesMap[seriesName].push({
        slug: post._path,
        frontmatter: post,
        path: post._path,
      });
    }
  });

  // 各シリーズの記事をseriesOrderでソート、slugを設定
  const result: Record<string, SeriesInfo> = {};
  Object.entries(seriesMap).forEach(([seriesName, posts]) => {
    const sortedPosts = posts.sort((a, b) => {
      const orderA = a.frontmatter.seriesOrder ?? 0;
      const orderB = b.frontmatter.seriesOrder ?? 0;
      return orderA - orderB;
    });

    // slugを取得（最初の記事のseriesSlugを使用、なければ自動生成）
    const slug = sortedPosts[0]?.frontmatter.seriesSlug || generateSlugFromSeriesName(seriesName);

    result[seriesName] = {
      name: seriesName,
      slug,
      posts: sortedPosts,
      totalPosts: sortedPosts.length,
    };
  });

  return result;
}

/**
 * slugからシリーズ情報を取得
 */
export async function getSeriesBySlug(slug: string): Promise<SeriesInfo | null> {
  const allSeries = await getAllSeries();
  const series = Object.values(allSeries).find((s) => s.slug === slug);
  return series || null;
}

/**
 * 特定のシリーズの記事を取得（シリーズ名で検索）
 */
export async function getSeriesPosts(seriesName: string): Promise<SeriesPost[]> {
  const allSeries = await getAllSeries();
  return allSeries[seriesName]?.posts || [];
}

/**
 * 特定のシリーズの記事を取得（slugで検索）
 */
export async function getSeriesPostsBySlug(slug: string): Promise<SeriesPost[]> {
  const series = await getSeriesBySlug(slug);
  return series?.posts || [];
}

/**
 * 記事が属するシリーズの前後の記事を取得
 */
export async function getSeriesNavigation(
  currentSlug: string,
  seriesName: string
): Promise<{
  seriesSlug: string;
  previous: SeriesPost | null;
  next: SeriesPost | null;
  currentIndex: number;
  totalPosts: number;
}> {
  const allSeries = await getAllSeries();
  const seriesInfo = allSeries[seriesName];

  if (!seriesInfo) {
    return {
      seriesSlug: "",
      previous: null,
      next: null,
      currentIndex: -1,
      totalPosts: 0,
    };
  }

  const seriesPosts = seriesInfo.posts;
  const currentIndex = seriesPosts.findIndex((post) => post.slug === currentSlug);

  if (currentIndex === -1) {
    return {
      seriesSlug: seriesInfo.slug,
      previous: null,
      next: null,
      currentIndex: -1,
      totalPosts: seriesPosts.length,
    };
  }

  return {
    seriesSlug: seriesInfo.slug,
    previous: currentIndex > 0 ? seriesPosts[currentIndex - 1] : null,
    next: currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : null,
    currentIndex,
    totalPosts: seriesPosts.length,
  };
} 