import BuyMeACoffee from "@/components/BuyMeACoffee";
import { Comments } from "@/components/Comments";
import { HatenaButton } from "@/components/share/HatenaButton";
import { TwitterShareButton } from "@/components/share/TwitterShareButton";
import { Tag } from "@/components/Tag";
import config from "@/config";
import { keywordFrontmatterSchema } from "@/libs/contents/keyword";
import { getContent, getFrontmatter, getPaths } from "@/libs/contents/markdown";
import clsx from "clsx";
import { format } from "date-fns";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import markdownStyles from "@/styles/markdown.module.scss";

type Props = {
  params: {
    slug: string[];
  };
};

const contentBasePath = "keywords";

export async function generateStaticParams() {
  const paths = await getPaths(contentBasePath);

  return paths.map((path) => ({
    slug: path.split("/"),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const forntmatter = await getFrontmatter({
    paths: [contentBasePath, ...params.slug],
    parser: keywordFrontmatterSchema,
  });

  return {
    title: `${forntmatter?.title} | ${config.metadata.title}`,
  };
}

export default async function Page({ params }: Props) {
  const content = await getContent({
    paths: [contentBasePath, ...params.slug],
    parser: {
      frontmatter: keywordFrontmatterSchema,
    },
  });

  if (!content) {
    notFound();
  }

  const { frontmatter, stylesheets, Component } = content;

  return (
    <>
      <Script
        stylesheets={stylesheets.map(
          (fileName) =>
            `/assets/${contentBasePath}/${params.slug.join("/")}/${fileName}`
        )}
      />
      <article
        className={clsx(
          markdownStyles.markdown,
          "max-w-4xl w-full mx-auto px-4 pb-16"
        )}
      >
        <h1 className="mt-8 mb-4 text-center">{frontmatter.title}</h1>
        <div className="flex mt-2 mb-2 justify-center items-center">
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
