import { glob } from "fs/promises";
import path from "path";
import { z } from "zod";
import { getRawContent } from "./file-loader";
import { parseRawContent } from "./parser";

/**
 * コンテンツのパスを取得する（言語固有ファイルは除外）
 */
export const getPaths = async (...paths: string[]): Promise<string[]> => {
  const basePath = ["src", "contents", ...paths];
  const md = await Array.fromAsync(
    glob(path.relative(process.cwd(), path.resolve(...basePath, "**", "*.md"))),
  );
  const mdx = await Array.fromAsync(
    glob(
      path.relative(process.cwd(), path.resolve(...basePath, "**", "*.mdx")),
    ),
  );

  // 言語固有のファイル（index.{lang}.md, index.{lang}.mdx）を除外
  const filteredFiles = [...md, ...mdx].filter((filepath) => {
    const filename = path.basename(filepath);
    // index.{lang}.md または index.{lang}.mdx のパターンにマッチする場合は除外
    return !filename.match(/^index\.[a-z]{2}\.(md|mdx)$/);
  });

  const dirs = filteredFiles.map((filepath) =>
    path
      .parse(filepath)
      .dir.split("/")
      .slice(2 + paths.length)
      .join("/"),
  );

  // 重複を削除
  return Array.from(new Set(dirs));
};

/**
 * すべてのフロントマターを取得する（draft除外）
 */
export async function getFrontmatters<T extends z.ZodTypeAny>({
  paths,
  schema,
}: {
  paths: string[];
  schema: T;
}) {
  const contentPaths = await getPaths(...paths);

  const frontmatters = await Promise.all(
    contentPaths.map(async (contentPath) => {
      const rawContent = await getRawContent(...paths, contentPath);
      if (!rawContent) {
        throw new Error(`Cannot get content: ${contentPath}`);
      }

      const content = parseRawContent(schema, rawContent);
      if (!content) {
        // エラーはparseRawContent内でログされるのでここではnullを返す
        return null;
      }
      const fm = content.frontmatter as unknown as Record<string, unknown>;
      return { ...fm, _path: contentPath } as z.infer<T> & { _path: string };
    }),
  );

  // Zodの型からdraftプロパティの存在を推論することは難しいため、anyにキャストしてフィルタリング
  const result = frontmatters.filter(
    (fm) => fm !== null && !(fm as any).draft,
  ) as Array<z.infer<T> & { _path: string }>;
  return result;
}
