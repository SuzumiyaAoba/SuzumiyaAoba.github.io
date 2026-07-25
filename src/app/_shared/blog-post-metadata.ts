import type { Metadata } from "next";
import { getBlogPostVariants } from "@/entities/blog";
import type { Locale } from "@/shared/lib/routing";
import { buildLocaleAlternates } from "./locale-alternates";

/**
 * ブログ記事詳細ページの Metadata を構築する。
 * canonical は常に閲覧中のロケール自身を指す(自己参照 canonical)。
 * hreflang で ja/en を相互参照しているため、canonical を翻訳版に向けると
 * Google に矛盾したシグナルを送り、非正規ロケールの評価が正規ロケールに
 * 吸収されてしまう。
 * description は frontmatter の `description` を優先し、未設定の場合は
 * category ベースの生成文言、それも無ければタイトルにフォールバックする。
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
  const fallbackDescription = post.frontmatter.category
    ? locale === "en"
      ? `${post.frontmatter.category} article.`
      : `Articles about ${post.frontmatter.category}.`
    : title;
  const description = post.frontmatter.description || fallbackDescription;

  return {
    title,
    description,
    alternates: buildLocaleAlternates(`/blog/post/${slug}`, locale, {
      availability: { ja: Boolean(postJa), en: Boolean(postEn) },
    }),
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.frontmatter.date,
    },
  };
}
