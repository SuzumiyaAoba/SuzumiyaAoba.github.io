import matter from "gray-matter";
import { cache } from "react";
import type { Locale } from "@/shared/lib/routing";
import {
  createArticleFileLister,
  readContentFileWithFallback,
  type ContentFormat,
  type ReadContentOptions,
} from "./read-content-file";

type ParsedContent<Frontmatter> = {
  slug: string;
  content: string;
  format: ContentFormat;
  frontmatter: Frontmatter;
};

/** 本文とサマリーで、ファイル読み込み・frontmatter の解析結果を共有する。 */
export function createContentReader<Frontmatter>(
  collectionDir: string,
  normalizeFrontmatter: (data: Record<string, unknown>) => Frontmatter,
) {
  const listFiles = createArticleFileLister(collectionDir);
  const readContent = cache(
    async (
      slug: string,
      locale: Locale,
      fallback: boolean,
    ): Promise<ParsedContent<Frontmatter> | null> => {
      const file = await readContentFileWithFallback(collectionDir, slug, listFiles, {
        locale,
        fallback,
      });
      if (!file) return null;

      const { content, data } = matter(file.raw);
      return { slug, content, format: file.format, frontmatter: normalizeFrontmatter(data) };
    },
  );

  // React.cache は引数を参照比較するため、都度生成される options をキーにしない。
  return (slug: string, options?: ReadContentOptions) =>
    readContent(slug, options?.locale ?? "ja", options?.fallback ?? true);
}
