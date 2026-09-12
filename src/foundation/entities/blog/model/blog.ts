import { cache } from "react";
import { unstable_cache } from "next/cache";

import {
  createContentReader,
  createContentCollection,
  listContentSlugs,
  findAdjacentByIndex,
  asString,
  asStringWithDefault,
  asDateString,
  asBoolean,
  asStringArray,
  type ContentSummary,
  type LocalizedContent,
} from "@/shared/lib/content-file";

const BLOG_COLLECTION_DIR = "blog";

/**
 * ブログ記事のフロントマター（メタデータ）の型定義
 */
export type BlogFrontmatter = {
  /** 記事のタイトル */
  title: string;
  /** 記事の投稿日 (YYYY-MM-DD形式) */
  date: string;
  /** 記事のカテゴリ */
  category?: string;
  /** 記事の要約（meta description / OGP description に使用） */
  description?: string;
  /** 記事に紐付くタグのリスト */
  tags?: string[];
  /** サムネイル画像のパス */
  thumbnail?: string;
  /** 下書き状態かどうか */
  draft?: boolean;
  /** レイアウトの種類 */
  layout?: string;
  /** Amazonアソシエイトの情報を表示するかどうか */
  amazonAssociate?: boolean;
  /** Amazon商品のIDリスト */
  amazonProductIds?: string[];
  /** 使用しているAIモデル名など */
  model?: string;
};

/**
 * ブログ記事の完全なデータ型定義
 */
export type BlogPost = {
  /** スラッグ（URLの一部） */
  slug: string;
  /** 記事の本文（Markdown形式） */
  content: string;
  /** ファイルのフォーマット */
  format: "md" | "mdx";
  /** メタデータ */
  frontmatter: BlogFrontmatter;
};

/**
 * ブログ記事のサマリー（一覧用）の型定義
 */
export type BlogPostSummary = ContentSummary<BlogPost>;

/**
 * すべてのブログ記事のスラッグを取得する
 * @returns スラッグの配列
 */
export const getBlogSlugs = cache(
  unstable_cache(
    async (): Promise<string[]> => listContentSlugs(BLOG_COLLECTION_DIR),
    ["blog-slugs"],
  ),
);

/**
 * 指定したスラッグの記事を取得する
 * @param slug 記事のスラッグ
 * @param options 読み込みオプション
 * @returns 記事データ。存在しない場合は null
 */
export const getBlogPost = createContentReader(BLOG_COLLECTION_DIR, normalizeFrontmatter);

const collection = createContentCollection({ getSlugs: getBlogSlugs, getContent: getBlogPost });

/**
 * 指定したスラッグの記事サマリーを取得する
 * @param slug 記事のスラッグ
 * @param options 読み込みオプション
 * @returns 記事サマリー。存在しない場合は null
 */
export const getBlogPostSummary = collection.getSummary;

/**
 * フロントマターのデータを正規化する
 * @param data gray-matter でパースされたデータ
 * @returns 正規化されたフロントマター
 */
function normalizeFrontmatter(data: Record<string, unknown>): BlogFrontmatter {
  const category = asString(data["category"]);
  const description = asString(data["description"]);
  const tags = asStringArray(data["tags"]);
  const thumbnail = asString(data["thumbnail"]);
  const draft = asBoolean(data["draft"]);
  const layout = asString(data["layout"]);
  const amazonAssociate = asBoolean(data["amazonAssociate"]);
  const amazonProductIds = asStringArray(data["amazonProductIds"]);
  const model = asString(data["model"]);

  return {
    title: asStringWithDefault(data["title"], ""),
    date: asDateString(data["date"]) ?? "",
    ...(category !== undefined ? { category } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(tags !== undefined ? { tags } : {}),
    ...(thumbnail !== undefined ? { thumbnail } : {}),
    ...(draft !== undefined ? { draft } : {}),
    ...(layout !== undefined ? { layout } : {}),
    ...(amazonAssociate !== undefined ? { amazonAssociate } : {}),
    ...(amazonProductIds !== undefined ? { amazonProductIds } : {}),
    ...(model !== undefined ? { model } : {}),
  };
}

/**
 * すべてのブログ記事を取得する（日付順降順、下書きを除く）
 * @returns 記事データの配列
 */
export const getBlogPosts = collection.getAll;

/**
 * 指定した記事の前後（前後の日付）の記事を取得する
 * @param slug 基準となる記事のスラッグ
 * @returns 前後の記事。存在しない場合は null
 */
export const getAdjacentPosts = cache(
  async (slug: string): Promise<{ prev: BlogPost | null; next: BlogPost | null }> => {
    const posts = await getBlogPosts();
    // posts are sorted by date desc (newest first)
    // next is newer (index - 1), prev is older (index + 1)
    return findAdjacentByIndex(posts, (post) => post.slug === slug);
  },
);

/**
 * 多言語対応した記事データの型定義
 */
export type LocalizedBlogPost = LocalizedContent<BlogPost>;

/**
 * 多言語対応した記事サマリーの型定義
 */
export type LocalizedBlogPostSummary = LocalizedContent<BlogPostSummary>;

/**
 * 指定したスラッグの多言語バリアントを取得する
 * @param slug 記事のスラッグ
 * @returns 多言語対応した記事データ
 */
export const getBlogPostVariants = collection.getVariants;

/**
 * すべての多言語対応記事を取得する（日付順降順、下書きを除く）
 * @returns 多言語対応記事の配列
 */
export const getBlogPostsVariants = cache(
  unstable_cache(collection.getAllVariants, ["blog-posts-variants"]),
);

/**
 * 公開済み（下書きでない）ブログ記事のスラッグ一覧を取得する。
 * generateStaticParams など、下書き記事を静的ビルド対象・公開 URL に
 * 含めてはいけない場面ではこちらを使う（getBlogSlugs は下書きを含む全件を返す）。
 * @returns スラッグの配列
 */
export const getPublishedBlogSlugs = cache(async (): Promise<string[]> => {
  const posts = await getBlogPostSummariesVariants();
  return posts.map((post) => post.slug);
});

/**
 * 指定したスラッグの多言語サマリーを取得する
 * @param slug 記事のスラッグ
 * @returns 多言語対応した記事サマリー
 */
export const getBlogPostSummaryVariants = collection.getSummaryVariants;

/**
 * すべての多言語対応記事サマリーを取得する（日付順降順、下書きを除く）
 * @returns 多言語対応記事サマリーの配列
 */
export const getBlogPostSummariesVariants = cache(
  unstable_cache(collection.getAllSummaryVariants, ["blog-post-summaries-variants"]),
);

/**
 * 多言語対応した記事の前後記事を取得する
 * @param slug 基準となる記事のスラッグ
 * @returns 多言語対応した前後の記事
 */
export const getAdjacentPostsVariants = cache(
  async (
    slug: string,
  ): Promise<{ prev: LocalizedBlogPost | null; next: LocalizedBlogPost | null }> => {
    const posts = await getBlogPostsVariants();
    return findAdjacentByIndex(posts, (post) => post.slug === slug);
  },
);

/**
 * 多言語対応した記事サマリーの前後記事を取得する
 * @param slug 基準となる記事のスラッグ
 * @returns 多言語対応した前後のサマリー
 */
export const getAdjacentPostSummariesVariants = cache(
  async (
    slug: string,
  ): Promise<{ prev: LocalizedBlogPostSummary | null; next: LocalizedBlogPostSummary | null }> => {
    const posts = await getBlogPostSummariesVariants();
    return findAdjacentByIndex(posts, (post) => post.slug === slug);
  },
);
