import { z } from "zod";

// 基本的なフロントマタースキーマ
export const baseFrontmatterSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  category: z.string(),
  tags: z.array(z.string()),
  draft: z.boolean().optional(),
});

// ブログ用のフロントマタースキーマ（基本 + 追加フィールド）
export const blogFrontmatterSchema = baseFrontmatterSchema.extend({
  description: z.string().optional(),
  author: z.string().optional(),
  ogImage: z.string().optional(),
});

// ノート用のフロントマタースキーマ（基本 + parent）
export const noteFrontmatterSchema = baseFrontmatterSchema.extend({
  parent: z.boolean().default(true),
  draft: z.boolean().default(false),
});

// キーワード用のフロントマタースキーマ（ノートと同じだが、独立したスキーマとして定義）
export const keywordFrontmatterSchema = noteFrontmatterSchema.extend({});

// 書籍用のフロントマタースキーマ（基本から一部フィールドをオプショナルに変更）
export const bookFrontmatterSchema = baseFrontmatterSchema
  .pick({
    title: true,
    date: true,
    draft: true,
  })
  .extend({
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
  });
