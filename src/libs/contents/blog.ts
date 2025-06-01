import { z } from "zod";
import type { Content } from "./markdown";
import { blogFrontmatterSchema } from "./schema";

export const layoutSchema = z.enum(["default", "CodeHike"]).default("default");

export const Pages = {
  blog: {
    root: "blog",
    assets: "/assets/blog/",
    frontmatter: blogFrontmatterSchema,
  },
  profile: {
    root: "profile",
    assets: "/assets/profile/",
    frontmatter: z.null(),
  },
} as const;

export type PageKey = keyof typeof Pages;

export type BlogContent<T extends PageKey> = Content<
  z.infer<(typeof Pages)[T]["frontmatter"]>
>;

export const POSTS_PER_PAGE = 10;
