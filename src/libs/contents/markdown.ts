import { glob, readFile } from "fs/promises";
import matter from "gray-matter";
import path from "path";
import type { FC } from "react";
import codeHikeComponent from "../markdown/codeHikeComponent";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { extractTocFromTree, type TocEntry } from "../rehype/toc";
import {
  defaultRemarkPlugins,
  defaultRehypePlugins,
} from "../markdown/mdxOptions";
import { z } from "zod";
import { VFile } from "vfile";
import { getFileGitHistory, getFileCreationDate, getFileLastModified, getGitHubRepoUrl, type GitCommit } from "../git-history";

type Format = "md" | "mdx";

export type RawContent = {
  path: string;
  format: Format;
  raw: string;
};

export type Content<FRONTMATTER> = {
  rawContent: RawContent;
  frontmatter: FRONTMATTER;
  content: string;
  stylesheets: string[];
  Component: FC<unknown>;
  gitHistory?: {
    createdDate: string | null;
    lastModified: string | null;
    repoUrl: string | null;
    filePath: string | null;
  };
};

export type ParsedContent<FRONTMATTER> = {
  format: Format;
  data: { [key: string]: unknown };
  frontmatter: FRONTMATTER;
  content: string;
};

export async function getRawContent(
  ...paths: string[]
): Promise<RawContent | null>;
export async function getRawContent(
  options: { lang?: string },
  ...paths: string[]
): Promise<RawContent | null>;
export async function getRawContent(
  ...args: [{ lang?: string }, ...string[]] | string[]
): Promise<RawContent | null> {
  let lang: string | undefined;
  let paths: string[];

  // オーバーロード対応：最初の引数がオブジェクトの場合は言語指定あり
  if (typeof args[0] === "object" && args[0] !== null && "lang" in args[0]) {
    lang = args[0].lang;
    paths = args.slice(1) as string[];
  } else {
    paths = args as string[];
  }

  const relative = path.join("src", "contents", ...paths);
  const abosolute = path.join(process.cwd(), relative);

  // 言語指定がある場合は index.{lang}.{md,mdx} を優先
  const suffix = lang ? `.${lang}` : "";
  const mdPath = path.resolve(path.join(abosolute, `index${suffix}.md`));
  const mdxPath = path.resolve(path.join(abosolute, `index${suffix}.mdx`));

  const readFileOptions = { encoding: "utf8" } as const;
  try {
    return {
      path: path.join(relative, `index${suffix}.md`),
      format: "md",
      raw: await readFile(mdPath, readFileOptions),
    };
  } catch (err) {
    try {
      return {
        path: path.join(relative, `index${suffix}.mdx`),
        format: "mdx",
        raw: await readFile(mdxPath, readFileOptions),
      };
    } catch {
      return null;
    }
  }
}

export const parseRawContent = <T extends z.ZodTypeAny>(
  schema: T,
  rawContent: RawContent,
): ParsedContent<z.infer<T>> | null => {
  const { content, data } = matter(rawContent.raw);
  const result = schema.safeParse(data);

  if (!result.success) {
    console.error(
      `Frontmatter parsing failed for ${rawContent.path}:`,
      result.error.flatten().fieldErrors,
    );
    return null;
  }

  return {
    format: rawContent.format,
    data,
    frontmatter: result.data,
    content,
  };
};

export async function getFrontmatter<T extends z.ZodTypeAny>({
  paths,
  schema,
  lang,
}: {
  paths: string[];
  schema: T;
  lang?: string;
}) {
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

  return parsedContent.frontmatter;
}

export async function getStylesheets(...paths: string[]): Promise<string[]> {
  const css = await Array.fromAsync(glob(path.resolve(...paths) + "/*.css"));
  return css.map((absolutePath) => path.basename(absolutePath));
}

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
    value: parsedContent.content,
  });

  // AST生成（TOC抽出用）- コンテンツ処理と同じプラグインを使用
  const tocProcessor = unified().use(remarkParse).use(remarkMdx);
  defaultRemarkPlugins.forEach((plugin) => {
    if (Array.isArray(plugin)) {
      tocProcessor.use(plugin[0], plugin[1]);
    } else {
      tocProcessor.use(plugin);
    }
  });
  tocProcessor.use(remarkRehype);
  const tocRehypePlugins = defaultRehypePlugins(path.dirname(rawContent.path));
  tocRehypePlugins.forEach((plugin) => {
    if (Array.isArray(plugin)) {
      tocProcessor.use(plugin[0], plugin[1]);
    } else {
      tocProcessor.use(plugin);
    }
  });
  const ast = tocProcessor.runSync(tocProcessor.parse(vfile), vfile);
  const toc = extractTocFromTree(ast as any);

  // HTML生成
  const htmlProcessor = unified().use(remarkParse).use(remarkMdx);
  defaultRemarkPlugins.forEach((plugin) => {
    if (Array.isArray(plugin)) {
      htmlProcessor.use(plugin[0], plugin[1]);
    } else {
      htmlProcessor.use(plugin);
    }
  });
  htmlProcessor.use(remarkRehype);
  const htmlRehypePlugins = defaultRehypePlugins(path.dirname(rawContent.path));
  htmlRehypePlugins.forEach((plugin) => {
    if (Array.isArray(plugin)) {
      htmlProcessor.use(plugin[0], plugin[1]);
    } else {
      htmlProcessor.use(plugin);
    }
  });
  htmlProcessor.use(rehypeStringify);

  const file = htmlProcessor.processSync(vfile);

  return {
    rawContent,
    content,
    frontmatter,
    stylesheets,
    Component: codeHikeComponent({
      source: content,
      scope: data,
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

export const getPaths = async (...paths: string[]): Promise<string[]> => {
  const basePath = ["src", "contents", ...paths];
  const md = await Array.fromAsync(
    glob(path.relative(process.cwd(), path.resolve(...basePath, "**", "*.md")))
  );
  const mdx = await Array.fromAsync(
    glob(path.relative(process.cwd(), path.resolve(...basePath, "**", "*.mdx")))
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
      .join("/")
  );

  // 重複を削除
  return Array.from(new Set(dirs));
};

export async function hasEnglishVersion(...paths: string[]): Promise<boolean> {
  const englishContent = await getRawContent({ lang: "en" }, ...paths);
  return englishContent !== null;
}

/**
 * コンテンツで利用可能な言語を取得する
 * @param paths コンテンツパス
 * @returns 利用可能な言語コードの配列（例: ["ja", "en"]）
 */
export async function getAvailableLanguages(...paths: string[]): Promise<string[]> {
  const relative = path.join("src", "contents", ...paths);
  const absolute = path.join(process.cwd(), relative);

  const languages: string[] = [];

  // デフォルト版（日本語）をチェック
  const defaultMdPath = path.resolve(path.join(absolute, "index.md"));
  const defaultMdxPath = path.resolve(path.join(absolute, "index.mdx"));
  try {
    await readFile(defaultMdPath, { encoding: "utf8" });
    languages.push("ja");
  } catch {
    try {
      await readFile(defaultMdxPath, { encoding: "utf8" });
      languages.push("ja");
    } catch {
      // デフォルト版がない
    }
  }

  // 言語固有ファイルをチェック
  const languageFiles = await Array.fromAsync(
    glob(path.resolve(absolute, "index.*.{md,mdx}"))
  );

  for (const file of languageFiles) {
    const filename = path.basename(file);
    const match = filename.match(/^index\.([a-z]{2})\.(md|mdx)$/);
    if (match) {
      languages.push(match[1]);
    }
  }

  return Array.from(new Set(languages));
}

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
