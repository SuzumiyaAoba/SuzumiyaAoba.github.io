import { Timeline } from "@/components/Article/Timeline";
import { Pages, POSTS_PER_PAGE } from "@/libs/contents/blog";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSortedPosts, paginatePosts } from "@/libs/contents/utils";
import { Pagination } from "@/components/ui/Pagination";

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
    schema: Pages["blog"].frontmatter,
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

      <Pagination
        currentPage={pageNumber}
        totalPages={totalPages}
        basePath="blog"
      />

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
    schema: Pages["blog"].frontmatter,
  });
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  // 2ページ目以降のみ
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    page: String(i + 2),
  }));
}
