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

  if (!frontmatter) {
    return {
      title: config.metadata.title,
    };
  }

  // 動的に生成されたOGP画像URLを設定
  const ogImageUrl =
    frontmatter.ogImage ||
    `${config.metadata.url}/blog/${slug}/opengraph-image`;
  const url = `${config.metadata.url}/blog/${slug}/`;

  return {
    title: `${frontmatter.title} | ${config.metadata.title}`,
    description:
      frontmatter.description ||
      `${frontmatter.title}に関する記事です。${config.metadata.description}`,
    keywords: [
      ...(frontmatter.tags || []),
      ...(config.metadata.keywords || []),
    ],
    authors: [{ name: frontmatter.author || config.metadata.author }],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: frontmatter.title,
      description:
        frontmatter.description || `${frontmatter.title}に関する記事です。`,
      url,
      siteName: config.metadata.title,
      locale: "ja_JP",
      type: "article",
      publishedTime: new Date(frontmatter.date).toISOString(),
      authors: frontmatter.author || config.metadata.author,
      tags: frontmatter.tags,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: frontmatter.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description:
        frontmatter.description || `${frontmatter.title}に関する記事です。`,
      creator: config.metadata.twitterHandle,
      images: [ogImageUrl],
    },
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
  const url = `${config.metadata.url}/blog/${slug}/`;

  return (
    <>
      <StylesheetLoader
        stylesheets={stylesheets}
        basePath="blog"
        slug={[slug]}
      />
      <Article
        title={frontmatter.title}
        date={frontmatter.date}
        tags={frontmatter.tags}
        description={frontmatter.description}
        author={frontmatter.author || config.metadata.author}
        url={url}
      >
        <Component />
      </Article>
    </>
  );
}
