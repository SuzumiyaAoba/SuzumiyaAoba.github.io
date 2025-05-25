import { z } from "zod";
import type { Content } from "./markdown";

export const frontmatterSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  draft: z.boolean().optional(),
});

export type BookContent = Content<z.infer<typeof frontmatterSchema>>;

export const Books = {
  root: "books",
  assets: "/assets/books/",
  frontmatter: frontmatterSchema,
};
