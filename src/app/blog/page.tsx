import { Pages, POSTS_PER_PAGE } from "@/libs/contents/blog";
import { getSortedPosts, paginatePosts } from "@/libs/contents/utils";
import { BlogPageClient } from "@/components/Pages/BlogPageClient";

export default async function BlogPage() {
  const posts = await getSortedPosts({
    paths: ["blog"],
    schema: Pages["blog"].frontmatter,
  });

  const { paginatedPosts, totalPages } = paginatePosts(
    posts,
    1,
    POSTS_PER_PAGE,
  );

  return (
    <BlogPageClient
      posts={paginatedPosts}
      totalPages={totalPages}
      currentPage={1}
      basePath="blog"
    />
  );
}
