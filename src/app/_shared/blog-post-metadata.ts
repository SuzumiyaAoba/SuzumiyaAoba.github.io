import type { Locale } from "@/shared/lib/routing";
import type { Metadata } from "@/shared/lib/site/metadata";
import { getBlogPostVariants } from "@/entities/blog";
import { buildArticleDetailMetadata } from "./article-detail-metadata";

/** ブログ記事詳細ページの Metadata を構築する。 */
export async function buildBlogPostMetadata(
  slug: string | undefined,
  locale: Locale
): Promise<Metadata> {
  return await buildArticleDetailMetadata({
    slug,
    locale,
    fallbackTitle: "Blog",
    basePath: "/blog/post",
    loadVariants: getBlogPostVariants,
    describeCategory: (category, currentLocale) =>
      currentLocale === "en"
        ? `${category} article.`
        : `Articles about ${category}.`,
    buildOpenGraph: (post) => ({
      type: "article",
      publishedTime: post.frontmatter.date,
    }),
  });
}
