import { z } from "zod";
import { Content } from "../markdown";

const frontmatterSchema = z.object({
  title: z.string(),
  date: z.date(),
  category: z.string(),
  tags: z.array(z.string()),
});

type NoteContent = Content<z.infer<typeof frontmatterSchema>>;
