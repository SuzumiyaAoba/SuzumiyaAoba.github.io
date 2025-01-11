import { z } from "zod";
import type { Content } from "./markdown";

export const frontmatterSchema = z.object({
  title: z.string(),
  date: z.date(),
  category: z.string(),
  tags: z.array(z.string()),
  parent: z.boolean().default(true),
  draft: z.boolean().default(false),
});

export type NoteContent = Content<z.infer<typeof frontmatterSchema>>;
