import { SiteLayout } from "@/widgets/site-layout";
import { toLocalePath } from "@/shared/lib/routing";
import type { Locale } from "@/shared/lib/routing";
import { BlogListingContent } from "@/entities/blog";
import type { BlogListingContentProps } from "@/entities/blog";

export type BlogPaginationPageContentProps = {
  locale: Locale;
  pageNumber: number;
  pageCount: number;
  posts: BlogListingContentProps["posts"];
};

export function BlogPaginationPageContent({
  locale,
  pageNumber,
  pageCount,
  posts,
}: BlogPaginationPageContentProps) {
  const pagePath = toLocalePath(
    pageNumber === 1 ? "/blog" : `/blog/${pageNumber}`,
    locale
  );

  return (
    <SiteLayout locale={locale} path={pagePath}>
      <BlogListingContent
        locale={locale}
        posts={posts}
        pageNumber={pageNumber}
        pageCount={pageCount}
        variant="paginated"
      />
    </SiteLayout>
  );
}
