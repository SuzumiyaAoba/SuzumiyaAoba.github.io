import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkHtmlKatex from "remark-html-katex";
import rehypePrettyCode from "rehype-pretty-code";
import { FC } from "react";
import rehypeImageSize from "../rehype/rehype-image-size";
import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";

const frontmastterSchema = z.object({
  title: z.string(),
  date: z.date(),
  category: z.string(),
  tags: z.array(z.string()),
  draft: z.boolean().optional(),
});

type Frontmatter = z.infer<typeof frontmastterSchema>;

type Post = {
  slug: string;
  frontmatter: Frontmatter;
  content: string;
  Component: FC<unknown>;
};

const POSTS_FOLDER = path.join(process.cwd(), "src/contents/blog");

async function readPostFile(slug: string): Promise<string | null> {
  const mdPath = path.resolve(path.join(POSTS_FOLDER, slug, "index.md"));
  const mdxPath = path.resolve(path.join(POSTS_FOLDER, slug, "index.mdx"));

  const readFileOptions = { encoding: "utf8" } as const;
  try {
    return await fs.readFile(mdPath, readFileOptions);
  } catch (err) {
    try {
      return await fs.readFile(mdxPath, readFileOptions);
    } catch {
      return null;
    }
  }
}

export async function get(slug: string): Promise<Post | null> {
  const raw = await readPostFile(slug);
  if (!raw) {
    return null;
  }

  const { content, data } = matter(raw);
  const frontmatter = frontmastterSchema.parse(data);

  return {
    slug,
    frontmatter,
    content,
    Component: () => (
      <MDXRemote
        source={content}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm, remarkMath, remarkHtmlKatex as any],
            rehypePlugins: [
              // @ts-ignore
              rehypeImageSize(slug),
              [
                rehypePrettyCode,
                {
                  defaultLang: {
                    block: "plaintext",
                    inline: "plaintext",
                  },
                  theme: "github-light",
                  keepBackground: false,
                },
              ],
            ],
          },
          scope: data,
        }}
        components={{
          img: (props) => (
            <Image
              src={props.src ?? "/"}
              alt={props.alt ?? ""}
              width={props.width as number}
              height={props.height as number}
              style={{
                objectFit: "contain",
                position: "relative",
              }}
            />
          ),
        }}
      />
    ),
  };
}

export async function getAll() {
  const files = await fs.readdir(POSTS_FOLDER);
  const posts = await Promise.all(
    files.map(async (file) => {
      const slug = file;
      const post = await get(slug);
      return post;
    })
  );
  return posts;
}
