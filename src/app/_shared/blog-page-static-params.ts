import type { Metadata } from "next";
import { getBlogPostSummariesVariants } from "@/entities/blog";
import { getPageCount } from "@/shared/lib/presentation";

export type BlogPageMetadataProps = {
  params: Promise<{ page?: string }>;
};

/**
 * ブログページネーションの generateMetadata。ja/en で完全に共通。
 */
export async function buildBlogPageMetadata({
  params,
}: BlogPageMetadataProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const pageNumber = Number(resolvedParams?.page);
  const title = Number.isFinite(pageNumber) ? `Blog Page ${pageNumber}` : "Blog";
  return { title };
}

/**
 * ブログページネーションの generateStaticParams。ja/en で完全に共通。
 */
export async function buildBlogPageStaticParams(): Promise<Array<{ page: string }>> {
  const posts = await getBlogPostSummariesVariants();
  const pageCount = getPageCount(posts.length);
  return Array.from({ length: pageCount }, (_, index) => ({
    page: String(index + 1),
  }));
}
