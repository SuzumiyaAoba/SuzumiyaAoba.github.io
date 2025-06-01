import { compareDesc } from "date-fns";
import { getFrontmatters } from "./markdown";
import { Parser } from "./markdown";

// 記事を日付順（新しい順）でソートする汎用関数
export function sortPostsByDate<T extends { frontmatter: { date: Date } }>(
  posts: T[]
): T[] {
  return posts.sort((a, b) =>
    compareDesc(a.frontmatter.date, b.frontmatter.date)
  );
}

// タグを抽出して重複を除去する汎用関数
export function extractUniqueTags<
  T extends { frontmatter: { tags: string[] } }
>(posts: T[]): string[] {
  const allTags = new Set<string>();
  posts.forEach((post) => {
    post.frontmatter.tags.forEach((tag) => {
      allTags.add(tag);
    });
  });
  return Array.from(allTags);
}

// タグごとの記事数をカウントする汎用関数
export function countTagOccurrences<
  T extends { frontmatter: { tags: string[] } }
>(posts: T[]): Record<string, number> {
  return posts.reduce<Record<string, number>>((acc, post) => {
    post.frontmatter.tags.forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});
}

// 特定のタグを持つ記事をフィルタリングする汎用関数
export function filterPostsByTag<T extends { frontmatter: { tags: string[] } }>(
  posts: T[],
  tag: string
): T[] {
  return posts.filter((post) => post.frontmatter.tags.includes(tag));
}

// 記事を取得してソートする汎用関数
export async function getSortedPosts<
  FRONTMATTER extends { draft?: boolean; date: Date }
>({
  paths,
  parser,
}: {
  paths: string[];
  parser: { frontmatter: Parser<FRONTMATTER> };
}) {
  const posts = await getFrontmatters({ paths, parser });
  return sortPostsByDate(posts);
}

// ページネーション用に記事をスライスする汎用関数
export function paginatePosts<T>(
  posts: T[],
  pageNumber: number,
  itemsPerPage: number
): {
  paginatedPosts: T[];
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
} {
  const start = (pageNumber - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const totalPages = Math.ceil(posts.length / itemsPerPage);

  return {
    paginatedPosts: posts.slice(start, end),
    totalPages,
    hasNextPage: pageNumber < totalPages,
    hasPrevPage: pageNumber > 1,
  };
}
