import { z } from "zod";
import type { Content } from "./markdown";
import { keywordFrontmatterSchema } from "./schema";

export { keywordFrontmatterSchema };

export type KeywordContent = Content<z.infer<typeof keywordFrontmatterSchema>>;
