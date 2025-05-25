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
import { Books, frontmatterSchema } from "@/libs/contents/books";

const CONTENT_BASE_PATH = "books";

// book frontmatter schema
// frontmatterSchemaはbooksモジュールからインポートするため削除
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
  const files = await glob([`${basePath.join("/")}/**/index.{md,mdx}`]);

  // パスからnameとchapterを抽出
  const params: PageParams[] = files
    .map((file) => {
      const rel = path.relative(basePath.join("/"), file);
      const parts = rel.split(path.sep);

      // ディレクトリ構造から適切なパラメータを抽出
      // 例: java-abc/02-01-environment/index.mdx -> { name: "java-abc", chapter: "02-01-environment" }
      if (parts.length >= 2 && parts[parts.length - 1].startsWith("index.")) {
        const name = parts[0]; // 最初の部分がname (java-abc)
        const chapter = parts[parts.length - 2]; // index.mdxの1つ上の階層がchapter (02-01-environment)
        return { name, chapter };
      }

      return { name: "", chapter: "" }; // フォールバック
    })
    .filter((params) => params.name && params.chapter); // 空のパラメータを除外

  return params;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { name, chapter } = await params;

  const frontmatter = await getFrontmatter({
    paths: [CONTENT_BASE_PATH, name, chapter],
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

export default async function BookChapterPage({ params }: PageProps) {
  const { name, chapter } = await params;

  const content = await getContent({
    paths: [CONTENT_BASE_PATH, name, chapter],
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
        slug={`${name}/${chapter}`}
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
