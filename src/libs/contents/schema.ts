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
  // シリーズ機能
  series: z.string().optional(), // シリーズ名
  seriesOrder: z.number().optional(), // シリーズ内での順序
  // Amazon アソシエイト
  amazonAssociate: z.boolean().optional(), // Amazon アソシエイトリンクが含まれるかどうか
  // MyLinkBox
  myLinkBoxIds: z.array(z.string()).optional(), // MyLinkBoxのID配列
  // 多言語対応
  hasEnglishVersion: z.boolean().optional(), // 英語版が存在するかどうか
});

// キーワード用のフロントマタースキーマ
export const keywordFrontmatterSchema = baseFrontmatterSchema.extend({
  parent: z.boolean().default(true),
  draft: z.boolean().default(false),
});

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
