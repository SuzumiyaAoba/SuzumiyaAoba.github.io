import { resolveLocalizedValue } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import type { LocalizedBlogPostSummary } from "./blog";

/** 一覧の 1 行に表示する記事の情報 */
export type PostIndexEntry = {
  slug: string;
  title: string;
  date?: string | undefined;
  description?: string | undefined;
  category?: string | undefined;
  tags: string[];
};

/** LocalizedBlogPostSummary を一覧表示用の形に解決する。翻訳がない記事はフォールバックに従う。 */
export function toPostIndexEntries(
  posts: LocalizedBlogPostSummary[],
  locale: Locale
): PostIndexEntry[] {
  return posts.flatMap((variant) => {
    const post = resolveLocalizedValue(variant, locale);
    if (!post) {
      return [];
    }
    const { frontmatter } = post;
    return [
      {
        slug: variant.slug,
        title: frontmatter.title || variant.slug,
        date: frontmatter.date,
        description: frontmatter.description,
        category: frontmatter.category,
        tags: frontmatter.tags ?? [],
      },
    ];
  });
}
