import path from "path";
import { z } from "zod";
import { VFile } from "vfile";
import type { Content } from "./types";
import type { TocEntry } from "../rehype/toc";
import { extractTocFromTree } from "../rehype/toc";
import { getRawContent, getStylesheets } from "./file-loader";
import { parseRawContent } from "./parser";
import { createProcessor } from "./processor";
import { extractAndLoadJsonImports } from "./mdx-imports";
import codeHikeComponent from "../markdown/codeHikeComponent";
import {
  getFileCreationDate,
  getFileLastModified,
  getGitHubRepoUrl,
} from "../git-history";

/**
 * コンテンツを取得してレンダリングする
 */
export const getContent = async <T extends z.ZodTypeAny>({
  schema,
  paths,
  lang,
}: {
  schema: T;
  paths: string[];
  lang?: string;
}): Promise<(Content<z.infer<T>> & { toc: TocEntry[] }) | null> => {
  const rawContent = lang
    ? await getRawContent({ lang }, ...paths)
    : await getRawContent(...paths);
  if (!rawContent) {
    return null;
  }

  const parsedContent = parseRawContent(schema, rawContent);
  if (!parsedContent) {
    return null;
  }
  const { frontmatter, content, data, format } = parsedContent;

  // JSON インポートを抽出してロード
  const contentDir = path.dirname(rawContent.path);
  const { content: processedContent, imports: jsonImports } =
    extractAndLoadJsonImports(content, contentDir);

  // frontmatter データと JSON インポートをマージ
  const scope = { ...data, ...jsonImports };

  const stylesheets = await getStylesheets(path.dirname(rawContent.path));

  // Git履歴を取得
  const absolutePath = path.join(process.cwd(), rawContent.path);
  const repoUrl = getGitHubRepoUrl();
  const gitHistory = {
    createdDate: getFileCreationDate(absolutePath),
    lastModified: getFileLastModified(absolutePath),
    repoUrl,
    filePath: rawContent.path,
  };

  const vfile = new VFile({
    path: rawContent.path,
    value: processedContent,
  });

  const basePath = path.dirname(rawContent.path);

  // AST生成（TOC抽出用）
  const tocProcessor = createProcessor({ basePath, includeStringify: false });
  const ast = tocProcessor.runSync(tocProcessor.parse(vfile), vfile);
  const toc = extractTocFromTree(ast as any);

  // HTML生成
  const htmlProcessor = createProcessor({ basePath, includeStringify: true });
  const file = htmlProcessor.processSync(vfile);

  return {
    rawContent,
    content,
    frontmatter,
    stylesheets,
    Component: codeHikeComponent({
      source: processedContent,
      scope,
      format,
      paths: rawContent.path
        .replace(/^src\/contents\//, "")
        .split("/")
        .slice(0, -1),
    }),
    toc,
    gitHistory,
  };
};
