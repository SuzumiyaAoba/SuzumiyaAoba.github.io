import { notFound } from "next/navigation";
import "katex/dist/katex.min.css";
import { Metadata } from "next";
import config from "@/config";
import { getContent, getFrontmatter, getPaths } from "@/libs/contents/markdown";
import { frontmatterSchema } from "@/libs/contents/notes";
import { Article } from "@/components/Article";
import { StylesheetLoader } from "@/components/StylesheetLoader";

type Props = {
  params: Promise<{
    slug: string[];
  }>;
};

const contentBasePath = "notes";

export async function generateStaticParams() {
  const paths = await getPaths(contentBasePath);

  return paths.map((path) => ({
    slug: path.split("/"),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const frontmatter = await getFrontmatter({
    paths: [contentBasePath, ...slug],
    parser: frontmatterSchema,
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
      frontmatter: frontmatterSchema,
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
        date={frontmatter.date || ""}
        tags={frontmatter.tags}
      >
        <Component />
      </Article>
    </>
  );
}
