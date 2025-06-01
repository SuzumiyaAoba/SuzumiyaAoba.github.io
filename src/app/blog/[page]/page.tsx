import { Tag } from "@/components/Tag";
import { Pages, POSTS_PER_PAGE } from "@/libs/contents/blog";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSortedPosts, paginatePosts } from "@/libs/contents/utils";

type PostCardProps = {
  slug: string;
  frontmatter: {
    title: string;
    date: Date;
    tags: string[];
  };
};

const PostCard = ({ slug, frontmatter }: PostCardProps) => {
  return (
    <div className="card p-4 transition-all duration-300 hover:transform hover:scale-[1.02]">
      <div
        className="flex gap-x-1 items-center font-thin text-sm"
        style={{ color: "var(--muted)" }}
      >
        <div className="i-mdi-calendar" />
        <div>{format(frontmatter.date, "yyyy/MM/dd")}</div>
      </div>
      <Link
        href={`/blog/${slug}/`}
        className="text-lg block my-2 transition-colors"
        style={{ color: "var(--foreground)" }}
      >
        {frontmatter.title}
      </Link>
      <div className="flex flex-wrap mt-2 gap-2 text-xs">
        {frontmatter.tags.map((tag) => (
          <Tag
            key={tag}
            label={tag}
            href={`/tags/${encodeURIComponent(tag)}/`}
          />
        ))}
      </div>
    </div>
  );
};

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
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="mb-8 text-3xl">Blog</h1>
      <div className="flex flex-col gap-6 mb-8">
        {paginatedPosts.map((post) => (
          <PostCard
            key={post.path}
            slug={post.path}
            frontmatter={post.frontmatter}
          />
        ))}
      </div>

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
