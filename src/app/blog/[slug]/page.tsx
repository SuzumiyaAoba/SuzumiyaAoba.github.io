import { notFound } from "next/navigation";

import markdownStyles from "@/styles/markdown.module.scss";
import "katex/dist/katex.min.css";
import { Comments } from "@/components/Comments";

import clsx from "clsx";
import * as blog from "@/libs/blog";

export default async function Page({ params }: { params: { slug: string } }) {
  const markdown = await blog.get(params.slug);

  if (!markdown) {
    notFound();
  }

  const { frontmatter, Component } = markdown;

  return (
    <article
      className={clsx(markdownStyles.markdown, "max-w-4xl mx-auto px-4")}
    >
      <h1 className="mt-8 text-center">{frontmatter.title}</h1>
      <section>
        <Component />
      </section>
      <hr className="my-16 border-dashed border-neutral-600" />
      <section className="mt-8">
        <Comments />
      </section>
    </article>
  );
}
