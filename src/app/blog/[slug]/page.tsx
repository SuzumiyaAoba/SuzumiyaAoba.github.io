import { compileMDX } from "next-mdx-remote/rsc";
import path from "path";
import { readFile, access } from "fs/promises";
import { notFound } from "next/navigation";

import remarkMath from "remark-math";
import remarkHtmlKatex from "remark-html-katex";
import remarkGfm from "remark-gfm";
import rehypeShiki from "@shikijs/rehype";

import styles from "@/styles/markdown.module.scss";
import "katex/dist/katex.min.css";

const POSTS_FOLDER = path.join(process.cwd(), "src/contents/blog");

async function readPostFile(slug: string) {
  const filePath = path.resolve(path.join(POSTS_FOLDER, slug, "index.md"));

  try {
    await access(filePath);
  } catch (err) {
    return null;
  }

  const fileContent = await readFile(filePath, { encoding: "utf8" });

  return fileContent;
}

export default async function Page({ params }: { params: { slug: string } }) {
  const markdown = await readPostFile(params.slug);

  if (!markdown) {
    notFound();
  }

  const { content, frontmatter } = await compileMDX<{
    title: string;
    date: Date;
    category: string;
    tags: string[];
    draft: boolean;
  }>({
    source: markdown,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkMath, remarkHtmlKatex as any],
        rehypePlugins: [
          [
            rehypeShiki,
            { themes: { light: "github-light", dark: "github-dark" } },
          ],
        ],
      },
    },
  });

  return (
    <article className={styles.markdown}>
      <h1>{frontmatter.title}</h1>
      <section>{content}</section>
    </article>
  );
}
