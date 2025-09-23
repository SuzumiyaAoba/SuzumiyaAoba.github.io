import { glob } from "fast-glob";
import path from "path";
import { getPaths } from "./markdown";
import { extractUniqueTags, getSortedPosts } from "./utils";
import { z } from "zod";

// ブログタグのためのパラメータ生成
export async function generateBlogTagParams<T extends z.ZodTypeAny>({
  paths,
  schema,
}: {
  paths: string[];
  schema: T;
}) {
  const posts = await getSortedPosts({ paths, schema });
  const allTags = extractUniqueTags(posts as unknown as Array<{ tags: string[] }>);

  return allTags.map((tag) => ({
    tag: tag,
  }));
}

// 単純なスラッグベースのパラメータ生成
export async function generateSlugParams(contentBasePath: string) {
  const paths = await getPaths(contentBasePath);
  return paths.map((path) => ({ slug: path }));
}

// ネストしたスラッグのパラメータ生成
export async function generateNestedSlugParams(contentBasePath: string) {
  const paths = await getPaths(contentBasePath);
  return paths.map((path) => ({ slug: path.split("/") }));
}

// ブックスタイルのパラメータ生成（name/chapterパターン）
export async function generateBookParams(contentBasePath: string) {
  const basePath = ["src", "contents", contentBasePath];
  const files = await glob([`${basePath.join("/")}/**/*.{md,mdx}`]);

  const params: Array<{ name: string; chapter?: string }> = [];

  files.forEach((file) => {
    const rel = path.relative(basePath.join("/"), file);
    const parts = rel.split(path.sep);
    const fileName = parts[parts.length - 1];

    if (fileName.startsWith("index.")) {
      // index.mdx → ディレクトリのトップページ（[name]ページ）
      const name = parts.slice(0, -1).join("/");
      params.push({ name });
    } else {
      // それ以外 → チャプターページ（[name]/[chapter]ページ）
      const chapter = fileName.replace(/\.(md|mdx)$/, "");
      const name = parts.slice(0, -1).join("/");
      params.push({ name, chapter });
    }
  });

  return params;
}

// ブックの名前（index.mdxのあるディレクトリ）のみを取得
export async function generateBookNameParams(contentBasePath: string) {
  const allParams = await generateBookParams(contentBasePath);
  return allParams
    .filter((param) => !param.chapter) // chapterが存在しないもの（index.mdx）
    .map((param) => ({ name: param.name }));
}

// ブックのチャプター（index.mdx以外のファイル）のみを取得
export async function generateBookChapterParams(contentBasePath: string) {
  const allParams = await generateBookParams(contentBasePath);
  const chapterParams = allParams
    .filter(
      (param): param is { name: string; chapter: string } => !!param.chapter
    )
    .map((param) => ({ name: param.name, chapter: param.chapter }));

  // チャプターファイルが存在しない場合は、空のパラメータを返すのではなく
  // ダミーパラメータを返してNext.jsのエラーを回避
  if (chapterParams.length === 0) {
    return [{ name: "placeholder", chapter: "placeholder" }];
  }

  return chapterParams;
}
