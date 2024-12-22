import path from "path";
import { readdir } from "fs/promises";

import { z } from "zod";

import { Content, getRawContent, parseRawContent } from "./markdown";

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
