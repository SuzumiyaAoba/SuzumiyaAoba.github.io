import matter from "gray-matter";
import { cache } from "react";

import { resolveContentRoot } from "@/shared/lib/content-root";

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
export type BlogPostSummary = {
  /** スラッグ */
  slug: string;
  /** メタデータ */
  frontmatter: BlogFrontmatter;
};

/**
 * ブログのロケール（言語）
 */
export type BlogLocale = "ja" | "en";

/**
 * コンテンツ読み込み時のオプション
 */
type ReadContentOptions = {
  /** 対象の言語。デフォルトは 'ja' */
  locale?: BlogLocale;
  /** 指定した言語がない場合にフォールバックするか。デフォルトは true */
  fallback?: boolean;
};

/**
 * 特定のロケールのコンテンツファイルを読み込む
 * @param slug 記事のスラッグ
 * @param locale 言語
 * @returns ファイルの内容とフォーマット。存在しない場合は null
 */
async function readContentFileForLocale(
  slug: string,
  locale: BlogLocale,
): Promise<{ raw: string; format: "md" | "mdx" } | null> {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const root = await resolveContentRoot();
  const baseDir = path.join(root, "blog", slug);

  const baseName = locale === "en" ? "index.en" : "index";
  const mdPath = path.join(baseDir, `${baseName}.md`);
  const mdxPath = path.join(baseDir, `${baseName}.mdx`);

  try {
    const raw = await fs.readFile(mdPath, "utf8");
    return { raw, format: "md" };
  } catch {
    try {
      const raw = await fs.readFile(mdxPath, "utf8");
      return { raw, format: "mdx" };
    } catch {
      return null;
    }
  }
}

/**
 * 記事ファイルを読み込む（フォールバック対応）
 * @param slug 記事のスラッグ
 * @param options 読み込みオプション
 * @returns ファイルの内容とフォーマット
 */
async function readContentFile(
  slug: string,
  options?: ReadContentOptions,
): Promise<{ raw: string; format: "md" | "mdx" } | null> {
  const locale = options?.locale ?? "ja";
  const fallback = options?.fallback ?? true;

  const file = await readContentFileForLocale(slug, locale);
  if (file) {
    return file;
  }

  if (!fallback || locale === "ja") {
    if (!fallback) {
      return null;
    }
    return readContentFileForLocale(slug, "en");
  }

  return readContentFileForLocale(slug, "ja");
}

/**
 * すべてのブログ記事のスラッグを取得する
 * @returns スラッグの配列
 */
export const getBlogSlugs = cache(async (): Promise<string[]> => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const root = await resolveContentRoot();
  const blogRoot = path.join(root, "blog");
  const entries = await fs.readdir(blogRoot, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
});

/**
 * 指定したスラッグの記事を取得する
 * @param slug 記事のスラッグ
 * @param options 読み込みオプション
 * @returns 記事データ。存在しない場合は null
 */
export const getBlogPost = cache(
  async (slug: string, options?: ReadContentOptions): Promise<BlogPost | null> => {
    const file = await readContentFile(slug, options);
    if (!file) {
      return null;
    }

    const { content, data } = matter(file.raw);
    const frontmatter = normalizeFrontmatter(data);

    return {
      slug,
      content,
      format: file.format,
      frontmatter,
    };
  },
);

/**
 * 指定したスラッグの記事サマリーを取得する
 * @param slug 記事のスラッグ
 * @param options 読み込みオプション
 * @returns 記事サマリー。存在しない場合は null
 */
export const getBlogPostSummary = cache(
  async (slug: string, options?: ReadContentOptions): Promise<BlogPostSummary | null> => {
    const file = await readContentFile(slug, options);
    if (!file) {
      return null;
    }

    const { data } = matter(file.raw);
    const frontmatter = normalizeFrontmatter(data);

    return {
      slug,
      frontmatter,
    };
  },
);

/**
 * フロントマターのデータを正規化する
 * @param data gray-matter でパースされたデータ
 * @returns 正規化されたフロントマター
 */
function normalizeFrontmatter(data: Record<string, unknown>): BlogFrontmatter {
  const title = typeof data["title"] === "string" ? data["title"] : "";
  const dateValue = data["date"];
  const date =
    dateValue instanceof Date
      ? dateValue.toISOString().slice(0, 10)
      : typeof dateValue === "string"
        ? dateValue
        : "";

  return {
    title,
    date,
    ...(typeof data["category"] === "string" ? { category: data["category"] } : {}),
    ...(Array.isArray(data["tags"])
      ? { tags: data["tags"].filter((tag): tag is string => typeof tag === "string") }
      : {}),
    ...(typeof data["thumbnail"] === "string" ? { thumbnail: data["thumbnail"] } : {}),
    ...(typeof data["draft"] === "boolean" ? { draft: data["draft"] } : {}),
    ...(typeof data["layout"] === "string" ? { layout: data["layout"] } : {}),
    ...(typeof data["amazonAssociate"] === "boolean"
      ? { amazonAssociate: data["amazonAssociate"] }
      : {}),
    ...(Array.isArray(data["amazonProductIds"])
      ? {
          amazonProductIds: data["amazonProductIds"].filter(
            (item): item is string => typeof item === "string",
          ),
        }
      : {}),
    ...(typeof data["model"] === "string" ? { model: data["model"] } : {}),
  };
}

/**
 * すべてのブログ記事を取得する（日付順降順、下書きを除く）
 * @returns 記事データの配列
 */
export const getBlogPosts = cache(async (): Promise<BlogPost[]> => {
  const slugs = await getBlogSlugs();
  const posts = await Promise.all(slugs.map((slug) => getBlogPost(slug)));
  return posts
    .filter((post): post is BlogPost => Boolean(post))
    .filter((post) => !post.frontmatter.draft)
    .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));
});

/**
 * 指定した記事の前後（前後の日付）の記事を取得する
 * @param slug 基準となる記事のスラッグ
 * @returns 前後の記事。存在しない場合は null
 */
export const getAdjacentPosts = cache(
  async (slug: string): Promise<{ prev: BlogPost | null; next: BlogPost | null }> => {
    const posts = await getBlogPosts();
    const index = posts.findIndex((post) => post.slug === slug);

    if (index === -1) {
      return { prev: null, next: null };
    }

    // posts are sorted by date desc (newest first)
    // next is newer (index - 1), prev is older (index + 1)
    return {
      prev: posts[index + 1] ?? null,
      next: posts[index - 1] ?? null,
    };
  },
);

/**
 * 多言語対応した記事データの型定義
 */
export type LocalizedBlogPost = {
  /** スラッグ */
  slug: string;
  /** 日本語版の記事データ */
  ja: BlogPost | null;
  /** 英語版の記事データ */
  en: BlogPost | null;
};

/**
 * 多言語対応した記事サマリーの型定義
 */
export type LocalizedBlogPostSummary = {
  /** スラッグ */
  slug: string;
  /** 日本語版のサマリー */
  ja: BlogPostSummary | null;
  /** 英語版のサマリー */
  en: BlogPostSummary | null;
};

/**
 * 指定したスラッグの多言語バリアントを取得する
 * @param slug 記事のスラッグ
 * @returns 多言語対応した記事データ
 */
export const getBlogPostVariants = cache(async (slug: string): Promise<LocalizedBlogPost> => {
  const [ja, en] = await Promise.all([
    getBlogPost(slug, { locale: "ja", fallback: false }),
    getBlogPost(slug, { locale: "en", fallback: false }),
  ]);

  return { slug, ja, en };
});

/**
 * すべての多言語対応記事を取得する（日付順降順、下書きを除く）
 * @returns 多言語対応記事の配列
 */
export const getBlogPostsVariants = cache(async (): Promise<LocalizedBlogPost[]> => {
  const slugs = await getBlogSlugs();
  const posts = await Promise.all(slugs.map((slug) => getBlogPostVariants(slug)));

  return posts
    .filter((post) => {
      const reference = post.ja ?? post.en;
      if (!reference) {
        return false;
      }
      return !reference.frontmatter.draft;
    })
    .sort((a, b) => {
      const dateA = (a.ja ?? a.en)?.frontmatter.date ?? "";
      const dateB = (b.ja ?? b.en)?.frontmatter.date ?? "";
      return dateA < dateB ? 1 : -1;
    });
});

/**
 * 指定したスラッグの多言語サマリーを取得する
 * @param slug 記事のスラッグ
 * @returns 多言語対応した記事サマリー
 */
export const getBlogPostSummaryVariants = cache(
  async (slug: string): Promise<LocalizedBlogPostSummary> => {
    const [ja, en] = await Promise.all([
      getBlogPostSummary(slug, { locale: "ja", fallback: false }),
      getBlogPostSummary(slug, { locale: "en", fallback: false }),
    ]);

    return { slug, ja, en };
  },
);

/**
 * すべての多言語対応記事サマリーを取得する（日付順降順、下書きを除く）
 * @returns 多言語対応記事サマリーの配列
 */
export const getBlogPostSummariesVariants = cache(async (): Promise<LocalizedBlogPostSummary[]> => {
  const slugs = await getBlogSlugs();
  const posts = await Promise.all(slugs.map((slug) => getBlogPostSummaryVariants(slug)));

  return posts
    .filter((post) => {
      const reference = post.ja ?? post.en;
      if (!reference) {
        return false;
      }
      return !reference.frontmatter.draft;
    })
    .sort((a, b) => {
      const dateA = (a.ja ?? a.en)?.frontmatter.date ?? "";
      const dateB = (b.ja ?? b.en)?.frontmatter.date ?? "";
      return dateA < dateB ? 1 : -1;
    });
});

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
    const index = posts.findIndex((post) => post.slug === slug);

    if (index === -1) {
      return { prev: null, next: null };
    }

    return {
      prev: posts[index + 1] ?? null,
      next: posts[index - 1] ?? null,
    };
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
    const index = posts.findIndex((post) => post.slug === slug);

    if (index === -1) {
      return { prev: null, next: null };
    }

    return {
      prev: posts[index + 1] ?? null,
      next: posts[index - 1] ?? null,
    };
  },
);
