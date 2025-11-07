import matter from "gray-matter";
import { z } from "zod";
import type { RawContent, ParsedContent } from "./types";
import { getRawContent } from "./file-loader";

/**
 * フロントマターを解析する
 */
export const parseRawContent = <T extends z.ZodTypeAny>(
  schema: T,
  rawContent: RawContent,
): ParsedContent<z.infer<T>> | null => {
  const { content, data } = matter(rawContent.raw);
  const result = schema.safeParse(data);

  if (!result.success) {
    console.error(
      `Frontmatter parsing failed for ${rawContent.path}:`,
      result.error.flatten().fieldErrors,
    );
    return null;
  }

  return {
    format: rawContent.format,
    data,
    frontmatter: result.data,
    content,
  };
};

/**
 * フロントマターのみを取得する
 */
export async function getFrontmatter<T extends z.ZodTypeAny>({
  paths,
  schema,
  lang,
}: {
  paths: string[];
  schema: T;
  lang?: string;
}) {
  const rawContent = lang
    ? await getRawContent({ lang }, ...paths)
    : await getRawContent(...paths);
  if (!rawContent) {
    return null;
  }

  const parsedContent = parseRawContent(schema, rawContent);
  if (!parsedContent) {
    return null;
  }

  return parsedContent.frontmatter;
}
