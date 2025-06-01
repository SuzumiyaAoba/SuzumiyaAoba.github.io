import { Timeline } from "@/components/Article/Timeline";
import { Pages, POSTS_PER_PAGE } from "@/libs/contents/blog";
import Link from "next/link";
import { getSortedPosts, paginatePosts } from "@/libs/contents/utils";

export default async function BlogPage() {
  const posts = await getSortedPosts({
    paths: ["blog"],
    parser: { frontmatter: Pages["blog"].frontmatter },
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

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex gap-3 justify-center my-12">
          <span className="px-4 py-2 rounded bg-gray-200 text-gray-500 cursor-not-allowed">
            1
          </span>
          <Link
            href="/blog/page/2/"
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            次へ
          </Link>
        </div>
      )}
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
