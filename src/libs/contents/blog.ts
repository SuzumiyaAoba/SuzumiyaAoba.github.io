/**
 * ブログコンテンツ設定
 *
 * このファイルは後方互換性のために維持されています。
 * 新しいコードでは @/config/content を使用してください。
 */
import { z } from "zod";
import type { Content } from "./types";
import { blogFrontmatterSchema } from "./schema";
import {
  Pages as ConfigPages,
  layoutSchema as configLayoutSchema,
  contentConfig,
} from "@/config/content";

export const layoutSchema = configLayoutSchema;
export const Pages = ConfigPages;
export type PageKey = keyof typeof Pages;

export type BlogContent<T extends PageKey> = Content<
  z.infer<(typeof Pages)[T]["frontmatter"]>
>;

export const POSTS_PER_PAGE = contentConfig.postsPerPage;
