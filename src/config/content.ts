import { z } from "zod";
import { blogFrontmatterSchema } from "@/libs/contents/schema";

/**
 * コンテンツタイプ定義
 */
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

/**
 * コンテンツ設定
 */
export const contentConfig = {
  postsPerPage: 10,
  contentTypes: [
    "blog",
    "series",
    "keywords",
    "books",
    "tools",
    "search",
  ] as const,
} as const;

export type ContentType = (typeof contentConfig.contentTypes)[number];
