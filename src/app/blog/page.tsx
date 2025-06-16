import { Timeline } from "@/components/Article/Timeline";
import { Pages, POSTS_PER_PAGE } from "@/libs/contents/blog";
import Link from "next/link";
import { getSortedPosts, paginatePosts } from "@/libs/contents/utils";
import { Pagination } from "@/components/ui/Pagination";

export default async function BlogPage() {
  const posts = await getSortedPosts({
    paths: ["blog"],
    schema: Pages["blog"].frontmatter,
  });

  const { paginatedPosts, totalPages } = paginatePosts(
    posts,
    1,
    POSTS_PER_PAGE
  );

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-6 py-10 pb-20">
      <h1 className="mb-10 text-3xl font-bold">Blog</h1>

      <Timeline posts={paginatedPosts} />

      <Pagination currentPage={1} totalPages={totalPages} basePath="blog" />

      <div className="mt-8">
        <Link
          href="/tags/"
          className="hover:underline text-base"
          style={{ color: "var(--accent-primary)" }}
        >
          すべてのタグを表示 →
        </Link>
      </div>
    </main>
  );
}
