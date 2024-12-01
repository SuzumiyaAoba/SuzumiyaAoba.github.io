import path from "path";
import { readdir, readFile } from "node:fs/promises";

import { z } from "zod";
import matter from "gray-matter";

import { FC } from "react";
import defaultComponent from "./defaultComponent";
import codeHikeComponent from "./codeHikeComponent";

export const layoutSchema = z.enum(["default", "CodeHike"]).default("default");

export type Layout = z.infer<typeof layoutSchema>;

export const frontmatterSchema = z.object({
  title: z.string(),
  date: z.date(),
  category: z.string(),
  tags: z.array(z.string()),
  layout: layoutSchema,
  draft: z.boolean().optional(),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export const Pages = {
  blog: {
    root: path.join(process.cwd(), "src/contents/blog"),
    assets: "/assets/blog/",
    frontmatter: frontmatterSchema,
  },
  profile: {
    root: path.join(process.cwd(), "src/contents/profile"),
    assets: "/assets/profile/",
    frontmatter: z.null(),
  },
} as const;

type Pages = typeof Pages;
export type PageKey = keyof Pages;

type RawContent = {
  path: string;
  format: "md" | "mdx";
  raw: string;
};

type Content<T extends PageKey> = {
  id: string;
  rawContent: RawContent;
  content: string;
  frontmatter: z.infer<Pages[T]["frontmatter"]>;
  Component: FC<unknown>;
};

export async function getRawContent<T extends PageKey>(
  page: Pages[T],
  dir: string
): Promise<RawContent | null> {
  const mdPath = path.resolve(path.join(page.root, dir, "index.md"));
  const mdxPath = path.resolve(path.join(page.root, dir, "index.mdx"));

  const readFileOptions = { encoding: "utf8" } as const;
  try {
    return {
      path: mdPath,
      format: "md",
      raw: await readFile(mdPath, readFileOptions),
    };
  } catch (err) {
    try {
      return {
        path: mdxPath,
        format: "mdx",
        raw: await readFile(mdxPath, readFileOptions),
      };
    } catch {
      return null;
    }
  }
}

export const getIds = async (key: PageKey): Promise<string[]> => {
  return await readdir(Pages[key].root);
};

type ParsedContent = {
  format: "md" | "mdx";
  page: PageKey;
  data: { [key: string]: any };
  frontmatter: Frontmatter;
  content: string;
};

export const parseRawContent = (
  key: PageKey,
  { raw, format }: RawContent
): ParsedContent | null => {
  const { content, data } = matter(raw);
  const frontmatter = Pages[key].frontmatter.parse(data);

  if (!frontmatter) {
    return null;
  }

  return {
    format,
    page: key,
    data,
    frontmatter,
    content,
  };
};

export async function getFrontmatter(key: PageKey, id: string) {
  const rawContent = await getRawContent(Pages[key], id);
  if (!rawContent) {
    return null;
  }

  const parsedContent = parseRawContent(key, rawContent);
  if (!parsedContent) {
    return null;
  }

  return parsedContent.frontmatter;
}

export async function* getFrontmatters(key: PageKey) {
  for await (const dir of await getIds(key)) {
    if (!dir) {
      continue;
    }

    const rawContent = await getRawContent(Pages[key], dir);
    if (!rawContent) {
      continue;
    }

    const parsedContent = parseRawContent(key, rawContent);
    if (!parsedContent) {
      continue;
    }

    const { frontmatter } = parsedContent;

    yield {
      slug: path.basename(dir),
      frontmatter,
    };
  }
}

export const getContent = async <T extends PageKey>(
  key: T,
  id: string
): Promise<Content<T> | null> => {
  const rawContent = await getRawContent(Pages[key], id);
  if (!rawContent) {
    return null;
  }

  const parsedContent = parseRawContent(key, rawContent);
  if (!parsedContent) {
    return null;
  }

  const component = chooseComponent(id, parsedContent);

  return {
    id,
    rawContent,
    content: parsedContent.content,
    frontmatter: parsedContent.frontmatter,
    Component: component,
  };
};

const chooseComponent = (
  slug: string,
  parsedContent: ParsedContent
): FC<unknown> => {
  const args = {
    key: parsedContent.page,
    slug,
    ...parsedContent,
  };
  switch (parsedContent.frontmatter.layout) {
    case "default":
      return defaultComponent(args);
    case "CodeHike":
      return codeHikeComponent(args);
  }
};
