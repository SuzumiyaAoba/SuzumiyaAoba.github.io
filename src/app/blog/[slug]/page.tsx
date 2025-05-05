import { notFound } from "next/navigation";
import { Metadata } from "next";
import "katex/dist/katex.min.css";
import config from "@/config";
import { Pages } from "@/libs/contents/blog";
import { getContent, getFrontmatter, getPaths } from "@/libs/contents/markdown";
import { Article } from "@/components/Article";
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
      <StylesheetLoader stylesheets={stylesheets} basePath="blog" slug={slug} />
      <Article
        title={frontmatter.title}
        date={frontmatter.date}
        tags={frontmatter.tags}
      >
        <Component />
      </Article>
    </>
  );
}
