import { notFound } from "next/navigation";
import { getBlogPostsVariants } from "@/entities/blog";
import { type Locale } from "@/shared/lib/routing";
import { BlogPaginationPageContent } from "./page-content";

const POSTS_PER_PAGE = 10;

function getPageCount(total: number): number {
  return Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
}

type PageProps = {
  params: Promise<{ page: string }>;
  locale?: Locale;
};

export default async function Page({ params, locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const { page } = await params;
  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    notFound();
  }

  const posts = await getBlogPostsVariants();
  const pageCount = getPageCount(posts.length);

  if (pageNumber > pageCount) {
    notFound();
  }

  const start = (pageNumber - 1) * POSTS_PER_PAGE;
  const pagePosts = posts.slice(start, start + POSTS_PER_PAGE);

  return (
    <BlogPaginationPageContent
      locale={resolvedLocale}
      pageNumber={pageNumber}
      pageCount={pageCount}
      posts={pagePosts}
    />
  );
}
