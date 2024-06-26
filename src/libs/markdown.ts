import fs from "node:fs";
import matter from "gray-matter";
import { z } from "zod";

import rehypeStarryNight from "@microflash/rehype-starry-night";
import rehypeImgLoad from "rehype-imgload";
import rehypeKatex from "rehype-katex";
import rehypePicture from "rehype-picture";
import rehypeStringify from "rehype-stringify";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import remarkJoinCjkLines from "remark-join-cjk-lines";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkGfm)
  .use(remarkJoinCjkLines)
  // @ts-ignore
  .use(remarkRehype, { allowDangerousHtml: true })
  // @ts-ignore
  .use(rehypePicture, {
    jpg: { webp: "image/webp" },
    png: { webp: "image/webp" },
  })
  .use(rehypeImgLoad, {
    mode: "lazy",
  })
  .use(remarkEmoji)
  .use(rehypeKatex)
  .use(rehypeStarryNight)
  .use(rehypeStringify, { allowDangerousHtml: true });

export type Markdown = {
  frontmatter: Frontmatter;
  content: string;
  html: string;
  path: string | undefined;
};

const frontmatterSchema = z.object({
  title: z.string(),
  created_at: z.date(),
  tags: z.array(z.string()),
  draft: z.boolean(),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export const parseMarkdown = async (path: string): Promise<Markdown> => {
  const contents = fs.readFileSync(path).toString("utf8");
  const { content, data } = matter(contents);
  const file = await processor.process(content);
  const html = String(file);
  const frontmatter = frontmatterSchema.parse(data);

  return {
    frontmatter,
    content,
    html,
    path,
  };
};
