import { notFound } from "next/navigation";
import "katex/dist/katex.min.css";
import { Metadata } from "next";
import config from "@/config";
import { getContent, getFrontmatter } from "@/libs/contents/markdown";
import { z } from "zod";
import { Article } from "@/components/Article";
import { StylesheetLoader } from "@/components/StylesheetLoader";
import path from "path";
import { glob } from "fast-glob";

const CONTENT_BASE_PATH = "books";

// book frontmatter schema
const frontmatterSchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  draft: z.boolean().optional(),
});

type PageParams = {
  name: string;
  chapter: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

export async function generateStaticParams(): Promise<PageParams[]> {
  // src/contents/books 配下の .md/.mdx ファイルをすべて取得
  const basePath = ["src", "contents", CONTENT_BASE_PATH];
  const files = await glob([`${basePath.join("/")}/**/*.{md,mdx}`]);

  // index.mdx 以外はファイル名を slug に含める
  const params: PageParams[] = files
    .filter((file) => !file.endsWith("index.mdx"))
    .map((file) => {
      const rel = path.relative(basePath.join("/"), file);
      const parts = rel.split(path.sep);
      // それ以外 → ファイル名を slug に含める
      const name = parts[parts.length - 1].replace(/\.(md|mdx)$/, "");
      const chapter = parts[parts.length - 2];
      return { name, chapter };
    });
  return params;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { name, chapter } = await params;
  const frontmatter = await getFrontmatter({
    paths: [CONTENT_BASE_PATH, name, chapter],
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

export default async function BookPage({ params }: PageProps) {
  const { name, chapter } = await params;

  const content = await getContent<typeof frontmatterSchema._type>({
    paths: [CONTENT_BASE_PATH, name, chapter],
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
        basePath={CONTENT_BASE_PATH}
        slug={[name, chapter]}
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
