import { z } from "zod";
import type { Content } from "./markdown";
import { noteFrontmatterSchema } from "./schema";

export { noteFrontmatterSchema as frontmatterSchema };

export type NoteContent = Content<z.infer<typeof noteFrontmatterSchema>>;
