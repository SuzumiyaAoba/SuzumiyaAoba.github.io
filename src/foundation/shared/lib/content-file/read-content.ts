import { cache } from "react";
import type { Locale } from "@/shared/lib/routing";
import { parseContent } from "./parse-content";
import {
  createArticleFileLister,
  readContentFileWithFallback,
} from "./read-content-file";
import type { ContentFormat, ReadContentOptions } from "./read-content-file";

type ParsedContent<Frontmatter> = {
  slug: string;
  content: string;
  format: ContentFormat;
  frontmatter: Frontmatter;
};

/** 本文とサマリーで、ファイル読み込み・frontmatter の解析結果を共有する。 */
export function createContentReader<Frontmatter>(
  collectionDir: string,
  normalizeFrontmatter: (data: Record<string, unknown>) => Frontmatter
) {
  const listFiles = createArticleFileLister(collectionDir);
  const readContent = cache(
    async (
      slug: string,
      locale: Locale,
      fallback: boolean
    ): Promise<ParsedContent<Frontmatter> | null> => {
      const file = await readContentFileWithFallback(
        collectionDir,
        slug,
        listFiles,
        {
          locale,
          fallback,
        }
      );
      if (!file) {
        return null;
      }

      return {
        slug,
        format: file.format,
        ...parseContent(file.raw, normalizeFrontmatter),
      };
    }
  );

  // React.cache は引数を参照比較するため、都度生成される options をキーにしない。
  return async (slug: string, options?: ReadContentOptions) =>
    await readContent(slug, options?.locale ?? "ja", options?.fallback ?? true);
}
