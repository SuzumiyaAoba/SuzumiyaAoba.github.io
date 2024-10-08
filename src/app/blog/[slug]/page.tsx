import { notFound } from "next/navigation";

import markdownStyles from "@/styles/markdown.module.scss";
import "katex/dist/katex.min.css";
import { Comments } from "@/components/Comments";

import clsx from "clsx";
import * as blog from "@/libs/blog";
import { Metadata } from "next";
import config from "@/config";
import { TwitterShareButton } from "@/components/share/TwitterShareButton";
import { Tag } from "@/components/Tag";
import { HatenaButton } from "@/components/share/HatenaButton";
import BuyMeACoffee from "@/components/BuyMeACoffee";

type Props = {
  params: {
    slug: string;
  };
};

export async function generateStaticParams() {
  const posts = await blog.getAll();

  return posts.map((post) => ({
    slug: post?.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await blog.get(params.slug);

  return {
    title: `${post?.frontmatter.title} | ${config.metadata.title}`,
  };
}

export default async function Page({ params }: Props) {
  const posts = await blog.get(params.slug);

  if (!posts) {
    notFound();
  }

  const { frontmatter, Component } = posts;

  return (
    <article
      className={clsx(markdownStyles.markdown, "max-w-4xl w-full mx-auto px-4")}
    >
      <h1 className="mt-8 mb-4 text-center">{frontmatter.title}</h1>
      <div className="flex gap-x-2 justify-center text-sm">
        {frontmatter.tags.map((tag) => (
          <Tag key={tag} label={tag} />
        ))}
      </div>
      <section>
        <Component />
      </section>
      <section className="flex gap-x-2 justify-end mt-12 mb-4">
        <HatenaButton />
        <TwitterShareButton title={frontmatter.title} />
      </section>
      <hr className="mb-8 border-dashed border-neutral-600" />
      <BuyMeACoffee />
      <section className="mt-8">
        <Comments />
      </section>
    </article>
  );
}
