import { z } from "zod";

/**
 * シリーズ定義のスキーマ
 */
export const seriesDefinitionSchema = z.object({
  // シリーズ名
  name: z.string(),
  // URL用のslug
  slug: z.string(),
  // 説明（オプショナル）
  description: z.string().optional(),
  // シリーズに含まれる記事のslugリスト（順序通り）
  posts: z.array(z.string()),
});

export type SeriesDefinition = z.infer<typeof seriesDefinitionSchema>;
