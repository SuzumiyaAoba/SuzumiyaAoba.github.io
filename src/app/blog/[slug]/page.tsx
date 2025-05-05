import { notFound } from "next/navigation";
import { Metadata } from "next";
import { format } from "date-fns";
import clsx from "clsx";

import markdownStyles from "@/styles/markdown.module.scss";
import "katex/dist/katex.min.css";
import config from "@/config";
import { Pages } from "@/libs/contents/blog";
import { getContent, getFrontmatter, getPaths } from "@/libs/contents/markdown";

// Components
import { Comments } from "@/components/Comments";
import { TwitterShareButton } from "@/components/share/TwitterShareButton";
import { HatenaButton } from "@/components/share/HatenaButton";
import { Tag } from "@/components/Tag";
import BuyMeACoffee from "@/components/BuyMeACoffee";
import { StylesheetLoader } from "@/components/StylesheetLoader";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const ids = await getPaths("blog");

  return ids.map((id) => ({
    slug: id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const frontmatter = await getFrontmatter({
    paths: ["blog", slug],
    parser: Pages["blog"].frontmatter,
  });

  return {
    title: `${frontmatter?.title} | ${config.metadata.title}`,
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const content = await getContent({
    paths: ["blog", slug],
    parser: {
      frontmatter: Pages["blog"].frontmatter,
    },
  });

  if (!content) {
    notFound();
  }

  const { frontmatter, stylesheets, Component } = content;

  return (
    <>
      <StylesheetLoader stylesheets={stylesheets} slug={slug} />
      <article
        className={clsx(
          markdownStyles.markdown,
          "max-w-4xl w-full mx-auto px-4 pb-16"
        )}
      >
        <h1 className="mt-8 mb-2 text-center">{frontmatter.title}</h1>
        <div className="flex mt-2 mb-4 justify-center items-center">
          <span className="i-ic-outline-sync mr-0.5" />
          {format(frontmatter.date, "yyyy/MM/dd")}
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-2 justify-center text-sm">
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
    </>
  );
}
