import { cache } from "react";
import { resolveLocalizedValue } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { getBlogPostSummariesVariants } from "./blog";
import type { BlogPostSummary, LocalizedBlogPostSummary } from "./blog";

/** 同じ記事内の重複タグは一度だけ数え、記事の並び順を維持する。 */
export function groupBlogPostsByTag(posts: readonly BlogPostSummary[]) {
  const index = new Map<string, BlogPostSummary[]>();
  for (const post of posts) {
    for (const tag of new Set(post.frontmatter.tags)) {
      if (!tag) {
        continue;
      }
      const entries = index.get(tag);
      if (entries) {
        entries.push(post);
      } else {
        index.set(tag, [post]);
      }
    }
  }
  return index;
}

/** 翻訳がない記事には、一覧表示と同じフォールバックを適用する。 */
export const getBlogTagIndex = cache(async (locale: Locale) => {
  const posts = await getBlogPostSummariesVariants();
  return groupBlogPostsByTag(
    posts.flatMap((post) => resolveLocalizedValue(post, locale) ?? [])
  );
});

/** 静的ルートとサイトマップで、日本語・英語双方のタグと最新日付を共有する。 */
export function summarizeBlogTags(posts: readonly LocalizedBlogPostSummary[]) {
  const index = groupBlogPostsByTag(
    posts.flatMap((post) =>
      [post.ja, post.en].filter((variant) => variant !== null)
    )
  );
  return Array.from(index, ([name, entries]) => {
    let lastModified: Date | undefined;
    for (const entry of entries) {
      const date = new Date(entry.frontmatter.date);
      if (
        !Number.isNaN(date.getTime()) &&
        (!lastModified || date > lastModified)
      ) {
        lastModified = date;
      }
    }
    return { name, lastModified };
  });
}

export const getAllBlogTags = cache(async () =>
  summarizeBlogTags(await getBlogPostSummariesVariants())
);

/** タグ名と記事数の組 */
export type BlogTagCount = { name: string; count: number };

/** 記事数の多いタグから順に並べる。同数ならロケールの辞書順。 */
export function rankBlogTags(
  index: ReadonlyMap<string, readonly unknown[]>,
  locale: Locale
): BlogTagCount[] {
  return Array.from(index, ([name, posts]) => ({
    name,
    count: posts.length,
  })).toSorted(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, locale)
  );
}

/** 一覧ページの導線に出す、よく書いているテーマ。 */
export const getPopularBlogTags = cache(
  async (locale: Locale, limit: number): Promise<BlogTagCount[]> =>
    rankBlogTags(await getBlogTagIndex(locale), locale).slice(0, limit)
);
