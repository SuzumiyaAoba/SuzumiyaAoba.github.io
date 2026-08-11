import { Header } from "@/widgets/header";
import { Footer } from "@/widgets/footer";
import { toLocalePath, type Locale } from "@/shared/lib/routing";
import { BlogListingContent, type BlogListingContentProps } from "@/entities/blog";

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
  const pagePath = toLocalePath(pageNumber === 1 ? "/blog" : `/blog/${pageNumber}`, locale);

  return (
    <div className="site-page">
      <Header locale={locale} path={pagePath} />
      <BlogListingContent
        locale={locale}
        posts={posts}
        pageNumber={pageNumber}
        pageCount={pageCount}
        variant="paginated"
      />
      <Footer locale={locale} />
    </div>
  );
}
