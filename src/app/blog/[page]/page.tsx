import { Pages, POSTS_PER_PAGE } from "@/libs/contents/blog";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSortedPosts, paginatePosts } from "@/libs/contents/utils";
import { PostCard } from "@/components/ui/PostCard";
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
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="mb-8 text-3xl">Blog</h1>
      <div className="flex flex-col gap-6 mb-8">
        {paginatedPosts.map((post) => (
          <PostCard key={post._path} post={post} basePath="blog" />
        ))}
      </div>

      <Pagination
        currentPage={pageNumber}
        totalPages={totalPages}
        basePath="blog"
      />

      <div className="mt-4">
        <Link
          href="/tags/"
          className="hover:underline"
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
