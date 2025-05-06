import { glob, readFile } from "fs/promises";
import matter from "gray-matter";
import path from "path";
import type { FC } from "react";
import codeHikeComponent from "../markdown/codeHikeComponent";

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
  data: { [key: string]: any };
  frontmatter: FRONTMATTER;
  content: string;
};

export type Parser<T> = {
  parse: (data: { [key: string]: any }) => T;
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

export const parseRawContent = <FRONTMATTER>(
  frontmatterParser: Parser<FRONTMATTER>,
  { raw, format }: RawContent
): ParsedContent<NonNullable<FRONTMATTER>> | null => {
  const { content, data } = matter(raw);
  const frontmatter = frontmatterParser.parse(data);

  if (!frontmatter) {
    return null;
  }

  return {
    format,
    data,
    frontmatter,
    content,
  };
};

export async function getFrontmatter<FRONTMATTER>({
  paths,
  parser,
}: {
  paths: string[];
  parser: Parser<FRONTMATTER>;
}) {
  const rawContent = await getRawContent(...paths);
  if (!rawContent) {
    return null;
  }

  const parsedContent = parseRawContent(parser, rawContent);
  if (!parsedContent) {
    return null;
  }

  return parsedContent.frontmatter;
}

export async function getStylesheets(...paths: string[]): Promise<string[]> {
  const css = await Array.fromAsync(glob(path.resolve(...paths) + "/*.css"));
  return css.map((absolutePath) => path.basename(absolutePath));
}

export const getContent = async <FRONTMATTER>({
  paths,
  parser: { frontmatter: frontmatterParser },
}: {
  paths: string[];
  parser: {
    frontmatter: Parser<FRONTMATTER>;
  };
}): Promise<Content<FRONTMATTER> | null> => {
  const rawContent = await getRawContent(...paths);
  if (!rawContent) {
    return null;
  }

  const parsedContent = parseRawContent(frontmatterParser, rawContent);
  const frontmatter = parsedContent?.frontmatter;
  if (!parsedContent || !frontmatter) {
    return null;
  }

  const stylesheets = await getStylesheets(path.dirname(rawContent.path));

  return {
    rawContent,
    content: parsedContent.content,
    frontmatter: parsedContent.frontmatter,
    stylesheets,
    Component: codeHikeComponent({
      ...parsedContent,
      paths,
      source: parsedContent.content,
      scope: parsedContent.data,
    }),
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

export const getFrontmatters = async <FRONTMATTER extends { draft?: boolean }>({
  paths,
  parser: { frontmatter },
}: {
  paths: string[];
  parser: {
    frontmatter: Parser<FRONTMATTER>;
  };
}) => {
  const contentPaths = await getPaths(...paths);

  return (
    await Promise.all(
      contentPaths.map(async (contentPath) => {
        const rawContent = await getRawContent(...paths, contentPath);
        if (!rawContent) {
          throw new Error(`Cannot get content: ${contentPath}`);
        }

        const content = parseRawContent(frontmatter, rawContent);
        if (!content?.frontmatter) {
          throw new Error(`Frontmatter does not exist: ${contentPath}`);
        }

        return {
          path: contentPath,
          frontmatter: content.frontmatter,
        };
      })
    )
  ).filter(
    ({ frontmatter }) => frontmatter.draft === undefined || !frontmatter.draft
  );
};
