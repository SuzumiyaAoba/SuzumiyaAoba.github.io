import { getBlogPostsVariants } from "@/entities/blog";
import { type Locale } from "@/shared/lib/routing";
import { BlogListPageContent } from "./page-content";

type PageProps = {
  locale?: Locale;
};

export default async function Page({ locale }: PageProps) {
  const resolvedLocale: Locale = locale ?? "ja";
  const posts = await getBlogPostsVariants();
  const pagePosts = posts.slice(0, 10);

  return (
    <BlogListPageContent
      locale={resolvedLocale}
      posts={pagePosts}
      totalCount={posts.length}
      currentPage={1}
    />
  );
}
