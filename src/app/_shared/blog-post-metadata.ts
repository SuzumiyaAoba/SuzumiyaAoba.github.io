import type { Metadata } from "next";
import { getBlogPostVariants } from "@/entities/blog";
import { toLocalePath, type Locale } from "@/shared/lib/routing";

/**
 * ブログ記事詳細ページの Metadata を構築する。
 * ja/en どちらの記事も存在する場合、canonical は常に en 版を指す
 * (既存の en 版ロジックを踏襲。ja のみ存在する場合は ja 版を指す)。
 */
export async function buildBlogPostMetadata(
  slug: string | undefined,
  locale: Locale,
): Promise<Metadata> {
  if (!slug) {
    return { title: "Blog" };
  }

  const { ja: postJa, en: postEn } = await getBlogPostVariants(slug);
  const post = locale === "en" ? (postEn ?? postJa) : (postJa ?? postEn);
  if (!post) {
    return { title: "Blog" };
  }

  const title = post.frontmatter.title || slug;
  const description = post.frontmatter.category
    ? locale === "en"
      ? `${post.frontmatter.category} article.`
      : `Articles about ${post.frontmatter.category}.`
    : title;
  const canonicalPath = postEn
    ? toLocalePath(`/blog/post/${slug}`, "en")
    : toLocalePath(`/blog/post/${slug}`, "ja");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.frontmatter.date,
    },
  };
}
