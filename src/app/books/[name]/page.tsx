import { notFound } from "next/navigation";
import "katex/dist/katex.min.css";
import { Metadata } from "next";
import config from "@/config";
import { getContent, getFrontmatter } from "@/libs/contents/markdown";
import { bookFrontmatterSchema } from "@/libs/contents/schema";
import { Article } from "@/components/Article";
import { StylesheetLoader } from "@/components/StylesheetLoader";
import { generateBookNameParams } from "@/libs/contents/params";

const CONTENT_BASE_PATH = "books";

type PageParams = {
  name: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

export async function generateStaticParams(): Promise<PageParams[]> {
  return generateBookNameParams(CONTENT_BASE_PATH);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { name } = await params;
  const frontmatter = await getFrontmatter({
    paths: [CONTENT_BASE_PATH, name],
    schema: bookFrontmatterSchema,
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

export default async function BookPage({ params }: PageProps) {
  const { name } = await params;

  const content = await getContent({
    paths: [CONTENT_BASE_PATH, name],
    schema: bookFrontmatterSchema,
  });

  if (!content) {
    notFound();
  }

  const { frontmatter, stylesheets, Component } = content;

  return (
    <>
      <StylesheetLoader
        stylesheets={stylesheets}
        basePath={CONTENT_BASE_PATH}
        slug={[name]}
      />
      <Article
        title={frontmatter.title}
        date={frontmatter.date}
        tags={frontmatter.tags ?? []}
      >
        <Component />
      </Article>
    </>
  );
}
