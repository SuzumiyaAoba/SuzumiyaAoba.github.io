import { z } from "zod";

/**
 * content/link-cards.json の構造。URL をキーにする。
 * scripts/fetch-link-cards.mjs が生成し、title や description は手で直してよい。
 *
 * そのスクリプトが Node から直接読み込むため、
 * zod 以外を import せず、型の除去だけで動く構文に限る。
 */
const LinkCardEntrySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1).optional(),
});

export const LinkCardSourceSchema = z.record(z.string(), LinkCardEntrySchema);

export type LinkCardEntry = z.infer<typeof LinkCardEntrySchema>;
