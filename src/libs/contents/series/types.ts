import { z } from "zod";
import type { Content } from "../types";
import { blogFrontmatterSchema } from "../schema";

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
  description?: string;
  posts: SeriesPost[];
  totalPosts: number;
}

/**
 * シリーズナビゲーション情報
 */
export interface SeriesNavigation {
  seriesName: string;
  seriesSlug: string;
  previous: SeriesPost | null;
  next: SeriesPost | null;
  currentIndex: number;
  totalPosts: number;
}
