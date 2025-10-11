import { notFound } from "next/navigation";
import { Metadata } from "next";
import config from "@/config";
import { Pages } from "@/libs/contents/blog";
import {
  getContent,
  getFrontmatter,
  getFrontmatters,
  getPaths,
} from "@/libs/contents/markdown";
import { Article } from "@/components/Article";
import { StylesheetLoader } from "@/components/StylesheetLoader";
import TOC from "@/components/TOC";
import styles from "@/styles/markdown.module.scss";
import { compareDesc } from "date-fns";
import { generateSlugParams } from "@/libs/contents/params";
import ArticleLayout from "@/components/Article/ArticleLayout";
import { ArticleHistory } from "@/components/ArticleHistory";
import { SeriesNavigation } from "@/components/SeriesNavigation";
import { getSeriesNavigation } from "@/libs/contents/series";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return generateSlugParams("blog");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const frontmatter = await getFrontmatter({
    paths: ["blog", slug],
    schema: Pages["blog"].frontmatter,
  });

  if (!frontmatter) {
    return {
      title: config.metadata.title,
    };
  }

  // 動的に生成されたOGP画像URLを設定
  const ogImageUrl =
    frontmatter.ogImage ||
    `${config.metadata.url}/blog/post/${slug}/opengraph-image`;
  const url = `${config.metadata.url}/blog/post/${slug}/`;

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
    schema: Pages["blog"].frontmatter,
  });

  if (!content) {
    notFound();
  }

  const { frontmatter, stylesheets, Component, toc, gitHistory } = content;
  const url = `${config.metadata.url}/blog/post/${slug}/`;

  // シリーズナビゲーション情報を取得
  const seriesNavigation = frontmatter.series 
    ? await getSeriesNavigation(slug, frontmatter.series)
    : null;

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
        <ArticleLayout
          tocSideClassName={styles.tocSideStyles}
          toc={<TOC toc={toc} />}
        >
          <Component />

          {/* シリーズナビゲーションを表示 */}
          {seriesNavigation && frontmatter.series && seriesNavigation.currentIndex !== -1 && (
            <SeriesNavigation
              seriesName={frontmatter.series}
              currentIndex={seriesNavigation.currentIndex}
              totalPosts={seriesNavigation.totalPosts}
              previous={seriesNavigation.previous}
              next={seriesNavigation.next}
              className="mt-12"
            />
          )}
          
          {/* 記事の更新履歴を表示 */}
          {gitHistory && (
            <ArticleHistory
              createdDate={gitHistory.createdDate ?? undefined}
              lastModified={gitHistory.lastModified ?? undefined}
              filePath={gitHistory.filePath ?? undefined}
              repoUrl={gitHistory.repoUrl ?? undefined}
              className="mt-12"
            />
          )}
        </ArticleLayout>
      </Article>
    </>
  );
}
