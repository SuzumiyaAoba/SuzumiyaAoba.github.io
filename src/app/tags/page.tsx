import { Pages } from "@/libs/contents/blog";
import { getFrontmatters } from "@/libs/contents/markdown";
import { Tag } from "@/components/Tag";
import Link from "next/link";

export default async function TagsPage() {
  const posts = await getFrontmatters({
    paths: ["blog"],
    parser: { frontmatter: Pages["blog"].frontmatter },
  });

  // すべてのタグを抽出し、出現回数でカウント
  const tagCounts = posts.reduce<Record<string, number>>((acc, post) => {
    post.frontmatter.tags.forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});

  // タグを出現回数でソート
  const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  return (
    <main className="flex flex-col w-full max-w-4xl mx-auto px-4 pb-16">
      <h1 className="mb-8 text-3xl">タグ一覧</h1>
      <div className="flex flex-wrap gap-4 mb-8">
        {sortedTags.map(([tag, count]) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}/`}
            className="flex items-center gap-2"
          >
            <Tag label={tag} size="md" />
            <span className="text-sm text-gray-500">({count})</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
