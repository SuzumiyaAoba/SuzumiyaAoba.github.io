import { Timeline } from "@/components/Article/Timeline";
import { Pages, POSTS_PER_PAGE } from "@/libs/contents/blog";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSortedPosts, paginatePosts } from "@/libs/contents/utils";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const pageNumber = parseInt(page, 10);
  if (isNaN(pageNumber) || pageNumber < 2) {
    notFound();
  }

  const posts = await getSortedPosts({
    paths: ["blog"],
    parser: { frontmatter: Pages["blog"].frontmatter },
  });

  const { paginatedPosts, totalPages } = paginatePosts(
    posts,
    pageNumber,
    POSTS_PER_PAGE
  );

  if (pageNumber > totalPages) {
    notFound();
  }

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-6 py-10 pb-20">
      <h1 className="mb-10 text-3xl font-bold">Blog</h1>

      <Timeline posts={paginatedPosts} />

      {/* ページネーション */}
      <div className="flex gap-3 justify-center my-12">
        {pageNumber > 2 && (
          <Link
            href="/blog/page/1/"
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            1
          </Link>
        )}

        {pageNumber > 1 && (
          <Link
            href={pageNumber === 2 ? "/blog/" : `/blog/page/${pageNumber - 1}/`}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            前へ
          </Link>
        )}

        <span className="px-4 py-2 rounded bg-gray-200 text-gray-500 cursor-not-allowed">
          {pageNumber}
        </span>

        {pageNumber < totalPages && (
          <Link
            href={`/blog/page/${pageNumber + 1}/`}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            次へ
          </Link>
        )}

        {pageNumber < totalPages - 1 && (
          <Link
            href={`/blog/page/${totalPages}/`}
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {totalPages}
          </Link>
        )}
      </div>

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

export async function generateStaticParams() {
  const posts = await getSortedPosts({
    paths: ["blog"],
    parser: { frontmatter: Pages["blog"].frontmatter },
  });
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  // 2ページ目以降のみ
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    page: String(i + 2),
  }));
}
