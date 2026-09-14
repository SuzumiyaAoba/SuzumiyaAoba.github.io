import { getBlogPost, getPublishedBlogSlugs } from "@/entities/blog";
import type { Locale } from "@/shared/lib/routing";
import { ArticleOpengraphImage, OpengraphTags, renderOpengraphImage } from "./opengraph-image";

export { OPENGRAPH_IMAGE_SIZE as BLOG_POST_OPENGRAPH_IMAGE_SIZE } from "./opengraph-image";

/**
 * ブログ記事詳細の generateStaticParams。ja/en で完全に共通。
 */
export async function generateBlogPostOpengraphStaticParams() {
  const slugs = await getPublishedBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

/**
 * ブログ記事詳細用の OGP 画像を描画する。ja/en の差分は取得する記事の locale のみ。
 */
export async function renderBlogPostOpengraphImage(slug: string, locale: Locale) {
  const post = await getBlogPost(slug, { locale, fallback: true });
  const title = post?.frontmatter.title || slug;
  const tags = post?.frontmatter.tags ?? [];

  return renderOpengraphImage(
    <ArticleOpengraphImage
      title={title}
      beforeTitle={<OpengraphTags tags={tags} fontSize={32} />}
    />,
  );
}
