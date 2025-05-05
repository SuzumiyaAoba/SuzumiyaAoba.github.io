import { Article } from "@/components/Article";
import { StylesheetLoader } from "@/components/StylesheetLoader";
import config from "@/config";
import { keywordFrontmatterSchema } from "@/libs/contents/keyword";
import { getContent, getFrontmatter, getPaths } from "@/libs/contents/markdown";
import { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

const contentBasePath = "keywords";

export async function generateStaticParams() {
  const paths = await getPaths(contentBasePath);
  return paths.map((path) => ({ slug: path.split("/") }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const frontmatter = await getFrontmatter({
    paths: [contentBasePath, ...slug],
    parser: keywordFrontmatterSchema,
  });

  return {
    title: `${frontmatter?.title} | ${config.metadata.title}`,
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const content = await getContent({
    paths: [contentBasePath, ...slug],
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
      <StylesheetLoader
        stylesheets={stylesheets}
        basePath={contentBasePath}
        slug={slug}
      />
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
