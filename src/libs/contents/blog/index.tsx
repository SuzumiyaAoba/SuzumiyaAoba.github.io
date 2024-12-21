import path from "path";
import { readdir } from "fs/promises";

import { z } from "zod";

import { FC } from "react";
import codeHikeComponent from "../../markdown/codeHikeComponent";
import { Content, getRawContent, getCSS, parseRawContent } from "../markdown";

export const layoutSchema = z.enum(["default", "CodeHike"]).default("default");

export type Layout = z.infer<typeof layoutSchema>;

export type BlogContent<T extends PageKey> = Content<
  z.infer<Pages[T]["frontmatter"]>
>;

const frontmatterSchema = z.object({
  title: z.string(),
  date: z.date(),
  category: z.string(),
  tags: z.array(z.string()),
  draft: z.boolean().optional(),
});

type Frontmatter = z.infer<typeof frontmatterSchema>;

export const Pages = {
  blog: {
    root: "blog",
    assets: "/assets/blog/",
    frontmatter: frontmatterSchema,
  },
  profile: {
    root: "profile",
    assets: "/assets/profile/",
    frontmatter: z.null(),
  },
} as const;

type Pages = typeof Pages;
export type PageKey = keyof Pages;

export const getIds = async (key: PageKey): Promise<string[]> => {
  return await readdir(
    path.resolve(process.cwd(), "src", "contents", Pages[key].root)
  );
};

type ParsedContent = {
  format: "md" | "mdx";
  page: PageKey;
  data: { [key: string]: any };
  frontmatter: Frontmatter;
  content: string;
};

export async function* getFrontmatters(key: PageKey) {
  for await (const dir of await getIds(key)) {
    if (!dir) {
      continue;
    }

    const rawContent = await getRawContent(Pages[key].root, dir);
    if (!rawContent) {
      continue;
    }

    const parsedContent = parseRawContent(Pages[key].frontmatter, rawContent);
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
): Promise<BlogContent<T> | null> => {
  const rawContent = await getRawContent(Pages[key].root, id);
  if (!rawContent) {
    return null;
  }

  const stylesheets = await getCSS(path.dirname(rawContent.path));

  const parsedContent = parseRawContent(Pages[key].frontmatter, rawContent);
  const frontmatter = parsedContent?.frontmatter;
  if (!parsedContent || !frontmatter) {
    return null;
  }

  const component = chooseComponent(id, {
    page: key,
    ...parsedContent,
    frontmatter,
  });

  return {
    rawContent,
    content: parsedContent.content,
    frontmatter: parsedContent.frontmatter,
    stylesheets,
    Component: component,
  };
};

const chooseComponent = (
  slug: string,
  parsedContent: ParsedContent
): FC<unknown> => {
  const key = parsedContent.page;
  const assetsBasePath = Pages[key].assets;
  const args = {
    assetsBasePath,
    slug,
    ...parsedContent,
  };
  return codeHikeComponent(args);
};
