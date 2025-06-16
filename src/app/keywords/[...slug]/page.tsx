import { notFound } from "next/navigation";
import "katex/dist/katex.min.css";
import { Metadata } from "next";
import config from "@/config";
import { getContent, getFrontmatter } from "@/libs/contents/markdown";
import { keywordFrontmatterSchema } from "@/libs/contents/keyword";
import { Article } from "@/components/Article";
import { StylesheetLoader } from "@/components/StylesheetLoader";
import { generateNestedSlugParams } from "@/libs/contents/params";

type Props = {
  params: Promise<{ slug: string[] }>;
};

const contentBasePath = "keywords";

export async function generateStaticParams() {
  return generateNestedSlugParams(contentBasePath);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const frontmatter = await getFrontmatter({
    paths: [contentBasePath, ...slug],
    schema: keywordFrontmatterSchema,
  });

  if (!frontmatter) {
    return {
      title: config.metadata.title,
    };
  }

  return {
    title: `${frontmatter.title} | ${config.metadata.title}`,
    description: frontmatter.title,
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const content = await getContent({
    paths: [contentBasePath, ...slug],
    schema: keywordFrontmatterSchema,
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
