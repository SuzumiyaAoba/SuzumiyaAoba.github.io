import { z } from "zod";
import path from "node:path";
import fs from "node:fs/promises";
import type { Content } from "./markdown";
import { blogFrontmatterSchema } from "./schema";
import { getFrontmatters } from "./markdown";
import { seriesDefinitionSchema, type SeriesDefinition } from "./series-schema";

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
 * シリーズ定義ディレクトリから全てのJSONファイルを読み込む
 */
async function loadSeriesDefinitions(): Promise<SeriesDefinition[]> {
  const seriesDir = path.join(process.cwd(), "src/contents/series");

  try {
    const files = await fs.readdir(seriesDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    const definitions = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(seriesDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        const json = JSON.parse(content);
        return seriesDefinitionSchema.parse(json);
      })
    );

    return definitions;
  } catch (error) {
    console.error("Failed to load series definitions:", error);
    return [];
  }
}

/**
 * 全てのシリーズを取得
 */
export async function getAllSeries(): Promise<Record<string, SeriesInfo>> {
  const definitions = await loadSeriesDefinitions();
  const allPosts = await getFrontmatters({
    paths: ["blog"],
    schema: blogFrontmatterSchema,
  });

  // 記事をslugでマップ化
  const postMap = new Map<string, z.infer<typeof blogFrontmatterSchema>>();
  allPosts.forEach((post) => {
    postMap.set(post._path, post);
  });

  const result: Record<string, SeriesInfo> = {};

  for (const definition of definitions) {
    const posts: SeriesPost[] = [];

    // 定義されたpostsの順序で記事を取得
    for (const postSlug of definition.posts) {
      const frontmatter = postMap.get(postSlug);
      if (frontmatter) {
        posts.push({
          slug: postSlug,
          frontmatter,
          path: postSlug,
        });
      } else {
        console.warn(`Post not found for slug: ${postSlug} in series: ${definition.name}`);
      }
    }

    result[definition.name] = {
      name: definition.name,
      slug: definition.slug,
      posts,
      totalPosts: posts.length,
    };
  }

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
 * 記事が属するシリーズを検索
 */
export async function findSeriesByPostSlug(postSlug: string): Promise<SeriesInfo | null> {
  const allSeries = await getAllSeries();

  for (const seriesInfo of Object.values(allSeries)) {
    if (seriesInfo.posts.some((post) => post.slug === postSlug)) {
      return seriesInfo;
    }
  }

  return null;
}

/**
 * 記事が属するシリーズの前後の記事を取得
 */
export async function getSeriesNavigation(
  currentSlug: string
): Promise<{
  seriesName: string;
  seriesSlug: string;
  previous: SeriesPost | null;
  next: SeriesPost | null;
  currentIndex: number;
  totalPosts: number;
} | null> {
  const seriesInfo = await findSeriesByPostSlug(currentSlug);

  if (!seriesInfo) {
    return null;
  }

  const seriesPosts = seriesInfo.posts;
  const currentIndex = seriesPosts.findIndex((post) => post.slug === currentSlug);

  if (currentIndex === -1) {
    return null;
  }

  return {
    seriesName: seriesInfo.name,
    seriesSlug: seriesInfo.slug,
    previous: currentIndex > 0 ? seriesPosts[currentIndex - 1] : null,
    next: currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : null,
    currentIndex,
    totalPosts: seriesPosts.length,
  };
} 