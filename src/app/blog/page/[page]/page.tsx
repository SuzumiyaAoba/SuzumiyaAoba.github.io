import { Timeline } from "@/components/Article/Timeline";
import { Pages, POSTS_PER_PAGE } from "@/libs/contents/blog";
import { getFrontmatters } from "@/libs/contents/markdown";
import { compareDesc } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";

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

  const posts = await getFrontmatters({
    paths: ["blog"],
    parser: { frontmatter: Pages["blog"].frontmatter },
  });

  const sortedPosts = posts.sort((a, b) =>
    compareDesc(a.frontmatter.date, b.frontmatter.date)
  );

  const totalPages = Math.ceil(sortedPosts.length / POSTS_PER_PAGE);
  if (pageNumber > totalPages) {
    notFound();
  }

  const start = (pageNumber - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;
  const pagePosts = sortedPosts.slice(start, end);

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="mb-8 text-3xl">Blog</h1>

      <Timeline posts={pagePosts} />

      {/* ページネーション */}
      <div className="flex gap-2 justify-center my-8">
        {pageNumber > 2 && (
          <Link
            href={`/blog/page/${pageNumber - 1}/`}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            前へ
          </Link>
        )}
        <Link
          href="/blog/"
          className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
        >
          1
        </Link>
        {Array.from({ length: totalPages - 1 }, (_, i) => i + 2).map((num) => (
          <Link
            key={num}
            href={`/blog/page/${num}/`}
            className={`px-3 py-1 rounded ${
              num === pageNumber
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            aria-current={num === pageNumber ? "page" : undefined}
          >
            {num}
          </Link>
        ))}
        {pageNumber < totalPages && (
          <Link
            href={`/blog/page/${pageNumber + 1}/`}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            次へ
          </Link>
        )}
      </div>
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
  const posts = await getFrontmatters({
    paths: ["blog"],
    parser: { frontmatter: Pages["blog"].frontmatter },
  });
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  // 2ページ目以降のみ
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    page: String(i + 2),
  }));
}
