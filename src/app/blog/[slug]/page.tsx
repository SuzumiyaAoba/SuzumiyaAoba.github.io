import path from "path";
import { readFile, access } from "fs/promises";
import { notFound } from "next/navigation";

import matter from "gray-matter";
import remarkMath from "remark-math";
import remarkHtmlKatex from "remark-html-katex";
import remarkGfm from "remark-gfm";

import markdownStyles from "@/styles/markdown.module.scss";
import "katex/dist/katex.min.css";
import { Comments } from "@/components/Comments";

import clsx from "clsx";
import rehypePrettyCode from "rehype-pretty-code";
import { serialize } from "next-mdx-remote/serialize";
import { MdxRemote } from "@/components/MdxRemote";

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

  const { content, data } = matter(markdown);

  const mdxSource = await serialize(content, {
    mdxOptions: {
      remarkPlugins: [remarkGfm, remarkMath, remarkHtmlKatex as any],
      rehypePlugins: [
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
  });

  return (
    <article
      className={clsx(markdownStyles.markdown, "max-w-4xl mx-auto px-4")}
    >
      <h1></h1>
      <section>
        <MdxRemote {...mdxSource} />
      </section>
      <hr
        style={{
          marginTop: "3rem",
        }}
      />
      <section className="mt-8">
        <Comments />
      </section>
    </article>
  );
}
