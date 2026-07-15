import { notFound } from "next/navigation";
import { getBlogPostSummariesVariants } from "@/entities/blog";
import { getPageCount, paginate } from "@/shared/lib/presentation";
import { resolveLocale, type Locale } from "@/shared/lib/routing";
import { BlogPaginationPageContent } from "./page-content";

type PageProps = {
  params: Promise<{ page: string }>;
  locale?: Locale;
};

export default async function Page({ params, locale }: PageProps) {
  const resolvedLocale = resolveLocale(locale);
  const { page } = await params;
  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    notFound();
  }

  const posts = await getBlogPostSummariesVariants();
  const pageCount = getPageCount(posts.length);

  if (pageNumber > pageCount) {
    notFound();
  }

  const pagePosts = paginate(posts, pageNumber);

  return (
    <BlogPaginationPageContent
      locale={resolvedLocale}
      pageNumber={pageNumber}
      pageCount={pageCount}
      posts={pagePosts}
    />
  );
}
