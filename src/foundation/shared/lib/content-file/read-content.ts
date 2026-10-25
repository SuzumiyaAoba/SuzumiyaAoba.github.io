import { cacheAsync } from "./cache-async";
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
  const readContent = cacheAsync(
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

  // options をプリミティブに正規化し、同じ読み込みのキャッシュキーを共有する。
  return async (slug: string, options?: ReadContentOptions) =>
    await readContent(slug, options?.locale ?? "ja", options?.fallback ?? true);
}
