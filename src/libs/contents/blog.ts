import { z } from "zod";

import type { Content } from "./markdown";

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
