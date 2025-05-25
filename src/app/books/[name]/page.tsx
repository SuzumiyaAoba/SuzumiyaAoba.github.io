import { notFound } from "next/navigation";
import "katex/dist/katex.min.css";
import { Metadata } from "next";
import config from "@/config";
import { getContent, getFrontmatter, getPaths } from "@/libs/contents/markdown";
import { z } from "zod";
import { Article } from "@/components/Article";
import { StylesheetLoader } from "@/components/StylesheetLoader";
import path from "path";
import { glob } from "fast-glob";
import { Books } from "@/libs/contents/books";

const CONTENT_BASE_PATH = "books";

// book frontmatter schema
// frontmatterSchemaはbooksモジュールからインポートするため削除
type PageParams = {
  name: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

export async function generateStaticParams(): Promise<PageParams[]> {
  // books 直下のindex.{md,mdx}ファイルと、各ブック名のディレクトリ内のindex.{md,mdx}を検索
  const basePath = ["src", "contents", CONTENT_BASE_PATH];

  // 各ブックのトップページを取得 (例: books/java-abc/index.md)
  const bookIndexFiles = await glob([
    `${basePath.join("/")}/**/index.{md,mdx}`,
  ]);

  // 各ファイルからnameパラメータを抽出
  const params: PageParams[] = bookIndexFiles
    .map((file) => {
      const rel = path.relative(basePath.join("/"), file);
      const parts = rel.split(path.sep);

      // 直接booksディレクトリ直下のindex.mdxを除外
      if (parts.length === 1 && parts[0].startsWith("index.")) {
        return null;
      }

      // books/java-abc/index.mdxの場合はnameをjava-abcに
      if (parts.length === 2 && parts[1].startsWith("index.")) {
        return { name: parts[0] };
      }

      return null;
    })
    .filter((param): param is PageParams => param !== null);

  return params;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { name } = await params;

  const frontmatter = await getFrontmatter({
    paths: [CONTENT_BASE_PATH, name],
    parser: Books.frontmatter,
  });

  if (!frontmatter) {
    return {
      title: config.metadata.title,
    };
  }

  return {
    title: `${frontmatter.title} | ${config.metadata.title}`,
    description: `${frontmatter.title}に関するドキュメントです。${config.metadata.description}`,
    keywords: [
      ...(frontmatter.tags || []),
      ...(config.metadata.keywords || []),
    ],
  };
}

export default async function BookPage({ params }: PageProps) {
  const { name } = await params;

  const content = await getContent({
    paths: [CONTENT_BASE_PATH, name],
    parser: {
      frontmatter: Books.frontmatter,
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
        slug={name}
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
