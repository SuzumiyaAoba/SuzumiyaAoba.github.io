import { glob, readFile } from "fs/promises";
import matter from "gray-matter";
import path from "path";
import type { FC } from "react";
import codeHikeComponent from "../markdown/codeHikeComponent";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { extractTocFromTree, type TocEntry } from "../rehype/toc";
import {
  defaultRemarkPlugins,
  defaultRehypePlugins,
} from "../markdown/mdxOptions";
import { z } from "zod";

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
};

export type ParsedContent<FRONTMATTER> = {
  format: Format;
  data: { [key: string]: unknown };
  frontmatter: FRONTMATTER;
  content: string;
};

export async function getRawContent(
  ...paths: string[]
): Promise<RawContent | null> {
  const relative = path.join("src", "contents", ...paths);
  const abosolute = path.join(process.cwd(), relative);
  const mdPath = path.resolve(path.join(abosolute, "index.md"));
  const mdxPath = path.resolve(path.join(abosolute, "index.mdx"));

  const readFileOptions = { encoding: "utf8" } as const;
  try {
    return {
      path: path.join(relative, "index.md"),
      format: "md",
      raw: await readFile(mdPath, readFileOptions),
    };
  } catch (err) {
    try {
      return {
        path: path.join(relative, "index.mdx"),
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
}: {
  paths: string[];
  schema: T;
}) {
  const rawContent = await getRawContent(...paths);
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
  paths,
  schema,
}: {
  paths: string[];
  schema: T;
}): Promise<(Content<z.infer<T>> & { toc: TocEntry[] }) | null> => {
  const rawContent = await getRawContent(...paths);
  if (!rawContent) {
    return null;
  }

  const parsedContent = parseRawContent(schema, rawContent);
  if (!parsedContent) {
    return null;
  }
  const { frontmatter } = parsedContent;

  const stylesheets = await getStylesheets(path.dirname(rawContent.path));

  // AST生成（TOC抽出用）- コンテンツ処理と同じプラグインを使用
  const processor = unified().use(remarkParse).use(remarkMdx);

  // 共通のremarkプラグインを追加
  defaultRemarkPlugins.forEach((plugin) => {
    if (Array.isArray(plugin)) {
      processor.use(plugin[0], plugin[1]);
    } else {
      processor.use(plugin);
    }
  });

  processor.use(remarkRehype);

  // 共通のrehypeプラグインを追加（TOC抽出のためrehypeKatexも含める）
  const rehypePlugins = defaultRehypePlugins(path.dirname(rawContent.path));
  rehypePlugins.forEach((plugin) => {
    if (Array.isArray(plugin)) {
      processor.use(plugin[0], plugin[1]);
    } else {
      processor.use(plugin);
    }
  });

  const ast = processor.runSync(processor.parse(parsedContent.content));
  const toc = extractTocFromTree(ast as any);

  // HTML生成
  const htmlProcessor = unified().use(remarkParse).use(remarkMdx);

  // 共通のremarkプラグインを追加
  defaultRemarkPlugins.forEach((plugin) => {
    if (Array.isArray(plugin)) {
      htmlProcessor.use(plugin[0], plugin[1]);
    } else {
      htmlProcessor.use(plugin);
    }
  });

  htmlProcessor.use(remarkRehype);

  // 共通のrehypeプラグインを追加
  rehypePlugins.forEach((plugin) => {
    if (Array.isArray(plugin)) {
      htmlProcessor.use(plugin[0], plugin[1]);
    } else {
      htmlProcessor.use(plugin);
    }
  });

  htmlProcessor.use(rehypeStringify);

  const file = htmlProcessor.processSync(parsedContent.content);

  return {
    rawContent,
    content: parsedContent.content,
    frontmatter,
    stylesheets,
    Component: codeHikeComponent({
      ...parsedContent,
      paths,
      source: parsedContent.content,
      scope: parsedContent.data,
    }),
    toc,
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

  const dirs = [...md, ...mdx].map((filepath) =>
    path
      .parse(filepath)
      .dir.split("/")
      .slice(2 + paths.length)
      .join("/")
  );

  return dirs;
};

export const getFrontmatters = async <T extends z.ZodTypeAny>({
  paths,
  schema,
}: {
  paths: string[];
  schema: T;
}) => {
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
      return { ...content.frontmatter, _path: contentPath };
    }),
  );

  // Zodの型からdraftプロパティの存在を推論することは難しいため、anyにキャストしてフィルタリング
  return frontmatters.filter(
    (fm): fm is z.infer<T> & { _path: string } =>
      fm !== null && !(fm as any).draft,
  );
};
