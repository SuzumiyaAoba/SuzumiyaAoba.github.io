import { notFound } from "next/navigation";
import "katex/dist/katex.min.css";
import { Metadata } from "next";
import config from "@/config";
import { getContent, getFrontmatter, getPaths } from "@/libs/contents/markdown";
import { frontmatterSchema, type NoteContent } from "@/libs/contents/notes";
import { Article } from "@/components/Article";
import { StylesheetLoader } from "@/components/StylesheetLoader";

const CONTENT_BASE_PATH = "notes";

type PageParams = {
  slug: string[];
};

type PageProps = {
  params: Promise<PageParams>;
};

export async function generateStaticParams(): Promise<PageParams[]> {
  const paths = await getPaths(CONTENT_BASE_PATH);

  return paths.map((path) => ({
    slug: path.split("/"),
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const frontmatter = await getFrontmatter({
    paths: [CONTENT_BASE_PATH, ...slug],
    parser: frontmatterSchema,
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

export default async function NotePage({ params }: PageProps) {
  const { slug } = await params;

  const content = await getContent<typeof frontmatterSchema._type>({
    paths: [CONTENT_BASE_PATH, ...slug],
    parser: {
      frontmatter: frontmatterSchema,
    },
  });

  if (!content) {
    notFound();
  }

  const { frontmatter, stylesheets, Component } = content;
  const notePath = slug.join("/");

  return (
    <>
      <StylesheetLoader
        stylesheets={stylesheets}
        basePath={CONTENT_BASE_PATH}
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
